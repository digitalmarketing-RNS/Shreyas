import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Invoice, InvoiceType, LedgerEntryType, Payment, PaymentChannel, PaymentMode, PaymentStatus, Gateway, Prisma } from '@prisma/client';
import {
  allocatePayment,
  applyDiscounts,
  computeLateFee,
  dateOnly,
  deriveInvoiceStatus,
  formatINR,
  LateFeeRuleInput,
  todayIST,
  toISODate,
} from '@rnsis/shared';
import { Tx } from '../../prisma/prisma.service';
import { AuditService } from '../../core/audit/audit.service';
import { SequenceService } from '../../core/sequence/sequence.service';
import { SchoolService } from '../../core/settings/school.service';

export interface NewInvoiceLine {
  feeHeadId: string;
  description: string;
  amount: number;
  discount?: number;
  discountSources?: { discountId: string; amount: number }[];
  isLateFee?: boolean;
}

export interface NewInvoice {
  schoolId: string;
  studentId: string;
  academicYearId: string;
  termId?: string | null;
  type: InvoiceType;
  title: string;
  issueDate?: string;
  dueDate: string;
  lines: NewInvoiceLine[];
  dedupeKey?: string | null;
  notes?: string | null;
  isProrated?: boolean;
  prorationNote?: string | null;
  createdById?: string | null;
  jobId?: string | null;
  applyAdvanceCredit?: boolean;
}

export interface NewPayment {
  schoolId: string;
  studentId: string;
  amount: number;
  mode: PaymentMode;
  channel: PaymentChannel;
  status?: PaymentStatus;
  paidAt?: Date;
  gateway?: Gateway | null;
  gatewayOrderId?: string | null;
  gatewayPaymentId?: string | null;
  gatewayMethod?: string | null;
  referenceNo?: string | null;
  chequeNo?: string | null;
  chequeBank?: string | null;
  chequeDate?: string | null;
  payerName?: string | null;
  remarks?: string | null;
  collectedById?: string | null;
  /** Settle these invoices first (oldest due first); remaining amount goes to other open invoices, then advance credit. */
  invoiceIds?: string[];
  /** If true, only the listed invoices are settled and the rest becomes advance credit. */
  restrictToInvoices?: boolean;
}

const OPEN_STATUSES = ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] as const;
const COUNTING_PAYMENT: PaymentStatus[] = ['SUCCESS', 'PENDING_CLEARANCE'];

/**
 * The fee ledger engine. Every financial mutation goes through this service inside a
 * database transaction and always leaves three things consistent:
 *   1. invoice lines/totals/status  (recomputed from allocations — never incremented blindly)
 *   2. payment allocated/unallocated amounts (advance credit = unallocated)
 *   3. the append-only LedgerEntry trail  (Σdebit − Σcredit = Σ open balances − advance credit)
 * `integrityCheck()` verifies (3) against (1)+(2) for any student.
 */
@Injectable()
export class FeeLedgerService {
  constructor(
    private readonly sequences: SequenceService,
    private readonly schools: SchoolService,
    private readonly audit: AuditService,
  ) {}

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */

  async ledger(
    tx: Tx,
    e: {
      schoolId: string;
      studentId: string;
      academicYearId?: string | null;
      type: LedgerEntryType;
      description: string;
      debit?: number;
      credit?: number;
      invoiceId?: string | null;
      paymentId?: string | null;
      refundId?: string | null;
      adjustmentId?: string | null;
      createdById?: string | null;
      entryDate?: Date;
    },
  ) {
    if (!(e.debit ?? 0) && !(e.credit ?? 0)) return;
    await tx.ledgerEntry.create({
      data: {
        schoolId: e.schoolId,
        studentId: e.studentId,
        academicYearId: e.academicYearId ?? null,
        type: e.type,
        description: e.description,
        debit: Math.max(0, Math.round(e.debit ?? 0)),
        credit: Math.max(0, Math.round(e.credit ?? 0)),
        invoiceId: e.invoiceId ?? null,
        paymentId: e.paymentId ?? null,
        refundId: e.refundId ?? null,
        adjustmentId: e.adjustmentId ?? null,
        createdById: e.createdById ?? null,
        entryDate: e.entryDate ?? new Date(),
      },
    });
  }

  private async yearName(tx: Tx, academicYearId: string) {
    const y = await tx.academicYear.findUniqueOrThrow({ where: { id: academicYearId }, select: { name: true } });
    return y.name;
  }

  async lateFeeHeadId(tx: Tx, schoolId: string) {
    const head = await tx.feeHead.findFirst({ where: { schoolId, category: 'LATE_FEE', isSystem: true } });
    if (head) return head.id;
    return (await tx.feeHead.create({ data: { schoolId, name: 'Late Fee', code: 'LATE', category: 'LATE_FEE', isSystem: true, priority: 999 } })).id;
  }

  async lateFeeRule(tx: Tx, academicYearId: string): Promise<LateFeeRuleInput> {
    const r = await tx.lateFeeRule.findUnique({ where: { academicYearId } });
    if (!r) return { enabled: false, mode: 'FIXED', amount: 0, percentBp: 0, frequency: 'PER_DAY', graceDays: 0, maxCap: null };
    return { enabled: r.enabled, mode: r.mode, amount: r.amount, percentBp: r.percentBp, frequency: r.frequency, graceDays: r.graceDays, maxCap: r.maxCap };
  }

  /** Lock an invoice row for the rest of the transaction (prevents lost updates). */
  async lockInvoice(tx: Tx, invoiceId: string) {
    await tx.$queryRaw`SELECT "id" FROM "Invoice" WHERE "id" = ${invoiceId} FOR UPDATE`;
  }

  /* ------------------------------------------------------------------ */
  /* Invoices                                                            */
  /* ------------------------------------------------------------------ */

  async createInvoice(tx: Tx, inv: NewInvoice): Promise<Invoice> {
    const lines = inv.lines.filter((l) => l.amount > 0);
    if (!lines.length) throw new BadRequestException('An invoice needs at least one line with an amount');
    const { settings } = await this.schools.get(inv.schoolId);
    const scope = await this.yearName(tx, inv.academicYearId);
    const invoiceNo = await this.sequences.nextFormatted(tx, inv.schoolId, 'INVOICE', scope, settings.numbering.invoicePrefix);
    const issueDate = inv.issueDate ?? todayIST();

    const invoice = await tx.invoice.create({
      data: {
        schoolId: inv.schoolId,
        invoiceNo,
        studentId: inv.studentId,
        academicYearId: inv.academicYearId,
        termId: inv.termId ?? null,
        type: inv.type,
        title: inv.title,
        issueDate: dateOnly(issueDate),
        dueDate: dateOnly(inv.dueDate),
        dedupeKey: inv.dedupeKey ?? null,
        notes: inv.notes ?? null,
        isProrated: inv.isProrated ?? false,
        prorationNote: inv.prorationNote ?? null,
        createdById: inv.createdById ?? null,
        jobId: inv.jobId ?? null,
        lines: {
          create: lines.map((l, i) => {
            const discount = Math.min(l.amount, Math.max(0, l.discount ?? 0));
            return {
              feeHeadId: l.feeHeadId,
              description: l.description,
              amount: l.amount,
              discount,
              netAmount: l.amount - discount,
              isLateFee: l.isLateFee ?? false,
              sortOrder: i,
              discountSources: (l.discountSources ?? []) as Prisma.InputJsonValue,
            };
          }),
        },
      },
    });

    const gross = lines.reduce((a, l) => a + l.amount, 0);
    const discount = lines.reduce((a, l) => a + Math.min(l.amount, Math.max(0, l.discount ?? 0)), 0);
    await this.ledger(tx, {
      schoolId: inv.schoolId,
      studentId: inv.studentId,
      academicYearId: inv.academicYearId,
      type: inv.type === 'OPENING_BALANCE' ? 'OPENING_BALANCE' : 'INVOICE',
      description: `${invoiceNo} · ${inv.title}`,
      debit: gross,
      invoiceId: invoice.id,
      createdById: inv.createdById,
    });
    if (discount > 0) {
      await this.ledger(tx, {
        schoolId: inv.schoolId,
        studentId: inv.studentId,
        academicYearId: inv.academicYearId,
        type: 'DISCOUNT',
        description: `Discount on ${invoiceNo}`,
        credit: discount,
        invoiceId: invoice.id,
        createdById: inv.createdById,
      });
    }
    let result = await this.recomputeInvoice(tx, invoice.id);
    if (inv.applyAdvanceCredit ?? settings.fees.autoApplyAdvanceCredit) {
      await this.applyAdvanceCredit(tx, inv.studentId, [invoice.id]);
      result = await tx.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    }
    return result;
  }

  /**
   * Recompute an invoice from its lines and active allocations. Any overpayment created by
   * a reduction (discount, waiver, cancelled late fee, earlier due date change) is released
   * back to the paying payment as advance credit.
   */
  async recomputeInvoice(tx: Tx, invoiceId: string, today = todayIST()): Promise<Invoice> {
    let invoice = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId }, include: { lines: true } });

    for (const line of invoice.lines) {
      const net = Math.max(0, line.amount - line.discount - line.waiver);
      const paidAgg = await tx.paymentAllocation.aggregate({ where: { invoiceLineId: line.id, reversedAt: null }, _sum: { amount: true } });
      let paid = paidAgg._sum.amount ?? 0;
      if (paid > net) {
        await this.releaseAllocations(tx, { invoiceLineId: line.id }, paid - net, 'Line reduced below amount paid — moved to advance credit');
        paid = net;
      }
      if (paid !== line.amountPaid || net !== line.netAmount) {
        await tx.invoiceLine.update({ where: { id: line.id }, data: { amountPaid: paid, netAmount: net } });
      }
    }

    invoice = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId }, include: { lines: true } });
    const subtotal = invoice.lines.filter((l) => !l.isLateFee).reduce((a, l) => a + l.amount, 0);
    const lateFee = invoice.lines.filter((l) => l.isLateFee).reduce((a, l) => a + l.amount, 0);
    const discountTotal = invoice.lines.reduce((a, l) => a + l.discount + l.waiver, 0);
    const total = invoice.lines.reduce((a, l) => a + l.netAmount, 0);
    const amountPaid = invoice.lines.reduce((a, l) => a + l.amountPaid, 0);
    const balance = total - amountPaid;
    const status =
      invoice.status === 'CANCELLED'
        ? 'CANCELLED'
        : deriveInvoiceStatus({ total, amountPaid, dueDate: invoice.dueDate, today });
    return tx.invoice.update({
      where: { id: invoiceId },
      data: {
        subtotal,
        lateFee,
        discountTotal,
        total,
        amountPaid,
        balance,
        status,
        paidAt: status === 'PAID' ? invoice.paidAt ?? new Date() : null,
      },
    });
  }

  /** Release (reverse) allocations LIFO until `amount` has been freed. */
  private async releaseAllocations(tx: Tx, where: Prisma.PaymentAllocationWhereInput, amount: number, reason: string) {
    let left = amount;
    const allocations = await tx.paymentAllocation.findMany({ where: { ...where, reversedAt: null }, orderBy: { createdAt: 'desc' } });
    const touchedPayments = new Set<string>();
    for (const a of allocations) {
      if (left <= 0) break;
      const take = Math.min(left, a.amount);
      await tx.paymentAllocation.update({ where: { id: a.id }, data: { reversedAt: new Date(), reversalReason: reason } });
      if (take < a.amount) {
        await tx.paymentAllocation.create({ data: { paymentId: a.paymentId, invoiceId: a.invoiceId, invoiceLineId: a.invoiceLineId, amount: a.amount - take } });
      }
      touchedPayments.add(a.paymentId);
      left -= take;
    }
    for (const p of touchedPayments) await this.recomputePayment(tx, p);
    return amount - left;
  }

  async recomputePayment(tx: Tx, paymentId: string): Promise<Payment> {
    const p = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const agg = await tx.paymentAllocation.aggregate({ where: { paymentId, reversedAt: null }, _sum: { amount: true } });
    const allocated = agg._sum.amount ?? 0;
    const unallocated = COUNTING_PAYMENT.includes(p.status) ? Math.max(0, p.amount - allocated - p.refundedAmount) : 0;
    return tx.payment.update({ where: { id: paymentId }, data: { allocatedAmount: allocated, unallocatedAmount: unallocated } });
  }

  /** Open lines for a student (optionally limited to some invoices), ready for allocation. */
  private async openLines(tx: Tx, studentId: string, invoiceIds?: string[]) {
    const invoices = await tx.invoice.findMany({
      where: { studentId, status: { in: [...OPEN_STATUSES] }, balance: { gt: 0 }, ...(invoiceIds?.length ? { id: { in: invoiceIds } } : {}) },
      include: { lines: { include: { feeHead: { select: { priority: true } } } } },
    });
    for (const i of invoices) await this.lockInvoice(tx, i.id);
    return invoices.flatMap((inv) =>
      inv.lines.map((l) => ({
        lineId: l.id,
        invoiceId: inv.id,
        balance: l.netAmount - l.amountPaid,
        dueDate: inv.dueDate,
        priority: l.isLateFee ? 999 : l.feeHead.priority,
        sortOrder: l.sortOrder,
      })),
    );
  }

  private async allocate(tx: Tx, paymentId: string, amount: number, lines: Awaited<ReturnType<FeeLedgerService['openLines']>>) {
    const plan = allocatePayment(amount, lines);
    for (const a of plan.allocations) {
      await tx.paymentAllocation.create({ data: { paymentId, invoiceId: a.invoiceId, invoiceLineId: a.lineId, amount: a.amount } });
    }
    const touched = [...new Set(plan.allocations.map((a) => a.invoiceId))];
    for (const id of touched) await this.recomputeInvoice(tx, id);
    return { ...plan, invoiceIds: touched };
  }

  /** Apply the student's advance credit (unallocated payments, oldest first) to open invoices. */
  async applyAdvanceCredit(tx: Tx, studentId: string, invoiceIds?: string[]) {
    const payments = await tx.payment.findMany({
      where: { studentId, status: { in: COUNTING_PAYMENT }, unallocatedAmount: { gt: 0 } },
      orderBy: { paidAt: 'asc' },
    });
    let applied = 0;
    for (const p of payments) {
      const lines = await this.openLines(tx, studentId, invoiceIds);
      if (!lines.some((l) => l.balance > 0)) break;
      const res = await this.allocate(tx, p.id, p.unallocatedAmount, lines);
      await this.recomputePayment(tx, p.id);
      applied += res.allocated;
    }
    return applied;
  }

  /* ------------------------------------------------------------------ */
  /* Payments                                                            */
  /* ------------------------------------------------------------------ */

  async recordPayment(tx: Tx, p: NewPayment): Promise<{ payment: Payment; allocated: number; advance: number; invoiceIds: string[] }> {
    if (!Number.isInteger(p.amount) || p.amount <= 0) throw new BadRequestException('Payment amount must be a positive amount in paise');
    const student = await tx.student.findUnique({ where: { id: p.studentId }, select: { id: true, schoolId: true, firstName: true, lastName: true } });
    if (!student || student.schoolId !== p.schoolId) throw new NotFoundException('Student not found');
    const year = await this.schools.currentYearOrThrow(p.schoolId);
    const { settings } = await this.schools.get(p.schoolId);
    const receiptNo = await this.sequences.nextFormatted(tx, p.schoolId, 'RECEIPT', year.name, settings.numbering.receiptPrefix);
    const status = p.status ?? (p.mode === 'CHEQUE' ? 'PENDING_CLEARANCE' : 'SUCCESS');

    const payment = await tx.payment.create({
      data: {
        schoolId: p.schoolId,
        receiptNo,
        studentId: p.studentId,
        academicYearId: year.id,
        amount: p.amount,
        mode: p.mode,
        status,
        channel: p.channel,
        gateway: p.gateway ?? null,
        gatewayOrderId: p.gatewayOrderId ?? null,
        gatewayPaymentId: p.gatewayPaymentId ?? null,
        gatewayMethod: p.gatewayMethod ?? null,
        referenceNo: p.referenceNo ?? null,
        chequeNo: p.chequeNo ?? null,
        chequeBank: p.chequeBank ?? null,
        chequeDate: p.chequeDate ? dateOnly(p.chequeDate) : null,
        payerName: p.payerName ?? null,
        remarks: p.remarks ?? null,
        collectedById: p.collectedById ?? null,
        paidAt: p.paidAt ?? new Date(),
        unallocatedAmount: p.amount,
      },
    });

    let allocated = 0;
    let invoiceIds: string[] = [];
    if (p.invoiceIds?.length) {
      const res = await this.allocate(tx, payment.id, p.amount, await this.openLines(tx, p.studentId, p.invoiceIds));
      allocated += res.allocated;
      invoiceIds = res.invoiceIds;
    }
    if (!p.restrictToInvoices && allocated < p.amount) {
      const res = await this.allocate(tx, payment.id, p.amount - allocated, await this.openLines(tx, p.studentId));
      allocated += res.allocated;
      invoiceIds = [...new Set([...invoiceIds, ...res.invoiceIds])];
    }
    const updated = await this.recomputePayment(tx, payment.id);

    await this.ledger(tx, {
      schoolId: p.schoolId,
      studentId: p.studentId,
      academicYearId: year.id,
      type: 'PAYMENT',
      description: `${receiptNo} · ${modeLabel(p.mode)}${p.referenceNo ? ` · Ref ${p.referenceNo}` : ''}${p.chequeNo ? ` · Chq ${p.chequeNo}` : ''}${status === 'PENDING_CLEARANCE' ? ' (subject to realisation)' : ''}`,
      credit: p.amount,
      paymentId: payment.id,
      createdById: p.collectedById,
      entryDate: payment.paidAt,
    });
    await this.audit.log(
      {
        schoolId: p.schoolId,
        action: 'payment.recorded',
        entityType: 'Payment',
        entityId: payment.id,
        summary: `${receiptNo}: ${formatINR(p.amount)} via ${modeLabel(p.mode)} for ${student.firstName} ${student.lastName}`,
        after: { receiptNo, amount: p.amount, mode: p.mode, status, channel: p.channel, allocated, advance: p.amount - allocated, invoiceIds },
      },
      tx,
    );
    return { payment: updated, allocated, advance: p.amount - allocated, invoiceIds };
  }

  /** Reverse every allocation of a payment (cheque bounce / void). Money no longer counts. */
  async reversePayment(tx: Tx, paymentId: string, status: 'BOUNCED' | 'VOID', reason: string, actorId: string | null) {
    const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
    if (!COUNTING_PAYMENT.includes(payment.status)) throw new BadRequestException(`Payment is already ${payment.status.toLowerCase()}`);
    if (payment.refundedAmount > 0) throw new BadRequestException('A payment with refunds cannot be reversed');
    const allocations = await tx.paymentAllocation.findMany({ where: { paymentId, reversedAt: null } });
    await tx.paymentAllocation.updateMany({ where: { paymentId, reversedAt: null }, data: { reversedAt: new Date(), reversalReason: reason } });
    await tx.payment.update({
      where: { id: paymentId },
      data: status === 'BOUNCED' ? { status, bouncedAt: new Date(), bounceReason: reason } : { status, voidedAt: new Date(), voidReason: reason },
    });
    for (const invId of new Set(allocations.map((a) => a.invoiceId))) await this.recomputeInvoice(tx, invId);
    await this.recomputePayment(tx, paymentId);
    await this.ledger(tx, {
      schoolId: payment.schoolId,
      studentId: payment.studentId,
      academicYearId: payment.academicYearId,
      type: 'PAYMENT_REVERSAL',
      description: `${payment.receiptNo} ${status === 'BOUNCED' ? 'cheque returned' : 'voided'} · ${reason}`,
      debit: payment.amount,
      paymentId,
      createdById: actorId,
    });
    await this.audit.log(
      {
        schoolId: payment.schoolId,
        action: status === 'BOUNCED' ? 'payment.cheque_bounced' : 'payment.voided',
        entityType: 'Payment',
        entityId: paymentId,
        summary: `${payment.receiptNo} ${status === 'BOUNCED' ? 'cheque bounced' : 'voided'}: ${reason}`,
        before: { status: payment.status, allocated: payment.allocatedAmount },
        after: { status },
      },
      tx,
    );
    return payment;
  }

  /** Free `amount` of a payment's invoice allocations (LIFO) so it can be refunded. */
  async releaseForRefund(tx: Tx, paymentId: string, amount: number) {
    const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const need = amount - payment.unallocatedAmount;
    if (need > 0) {
      const allocs = await tx.paymentAllocation.findMany({ where: { paymentId, reversedAt: null } });
      for (const id of new Set(allocs.map((a) => a.invoiceId))) await this.lockInvoice(tx, id);
      await this.releaseAllocations(tx, { paymentId }, need, 'Released for refund');
      for (const id of new Set(allocs.map((a) => a.invoiceId))) await this.recomputeInvoice(tx, id);
    }
    return this.recomputePayment(tx, paymentId);
  }

  /* ------------------------------------------------------------------ */
  /* Adjustments: cancellation, late fee, discounts, waivers             */
  /* ------------------------------------------------------------------ */

  async cancelInvoice(tx: Tx, invoiceId: string, reason: string, actorId: string | null) {
    await this.lockInvoice(tx, invoiceId);
    const inv = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
    if (inv.status === 'CANCELLED') throw new BadRequestException('Invoice is already cancelled');
    const allocs = await tx.paymentAllocation.findMany({ where: { invoiceId, reversedAt: null } });
    await tx.paymentAllocation.updateMany({ where: { invoiceId, reversedAt: null }, data: { reversedAt: new Date(), reversalReason: `Invoice cancelled: ${reason}` } });
    for (const pid of new Set(allocs.map((a) => a.paymentId))) await this.recomputePayment(tx, pid);
    await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledById: actorId, cancelReason: reason, dedupeKey: null },
    });
    await this.recomputeInvoice(tx, invoiceId);
    await this.ledger(tx, {
      schoolId: inv.schoolId,
      studentId: inv.studentId,
      academicYearId: inv.academicYearId,
      type: 'INVOICE_CANCELLED',
      description: `${inv.invoiceNo} cancelled · ${reason}`,
      credit: inv.total,
      invoiceId,
      createdById: actorId,
    });
    await this.audit.log(
      {
        schoolId: inv.schoolId,
        action: 'invoice.cancelled',
        entityType: 'Invoice',
        entityId: invoiceId,
        summary: `${inv.invoiceNo} cancelled (${formatINR(inv.total)}); ${formatINR(allocs.reduce((a, b) => a + b.amount, 0))} paid moved to advance credit. Reason: ${reason}`,
        before: { status: inv.status, total: inv.total, amountPaid: inv.amountPaid },
        after: { status: 'CANCELLED' },
      },
      tx,
    );
    // Freed money may settle the student's other open invoices.
    await this.applyAdvanceCredit(tx, inv.studentId);
  }

  /**
   * Charge / recalculate the late fee on an invoice.
   * mode "accrue" (daily job) never lowers an already-charged late fee;
   * mode "recalculate" (due-date change) may lower it, even to zero.
   */
  async applyLateFee(tx: Tx, invoiceId: string, mode: 'accrue' | 'recalculate', actorId: string | null, today = todayIST()): Promise<number> {
    await this.lockInvoice(tx, invoiceId);
    const inv = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId }, include: { lines: true } });
    if (inv.status === 'CANCELLED' || inv.status === 'PAID' || inv.lateFeeFrozen) return 0;
    const rule = await this.lateFeeRule(tx, inv.academicYearId);
    const lateLine = inv.lines.find((l) => l.isLateFee);
    const current = lateLine?.amount ?? 0;
    const principal = inv.lines.filter((l) => !l.isLateFee).reduce((a, l) => a + (l.netAmount - l.amountPaid), 0);

    let target: number;
    if (!rule.enabled && mode === 'accrue') return 0;
    if (principal <= 0 && mode === 'accrue') return 0;
    const computed = computeLateFee(rule, principal, inv.dueDate, today).amount;
    target = mode === 'accrue' ? Math.max(current, computed) : computed;
    if (!rule.enabled && mode === 'recalculate') target = current; // disabled rule: leave history alone
    const delta = target - current;
    if (delta === 0) return 0;

    if (lateLine) {
      await tx.invoiceLine.update({ where: { id: lateLine.id }, data: { amount: target, netAmount: Math.max(0, target - lateLine.discount - lateLine.waiver) } });
    } else {
      await tx.invoiceLine.create({
        data: {
          invoiceId,
          feeHeadId: await this.lateFeeHeadId(tx, inv.schoolId),
          description: 'Late fee',
          amount: target,
          netAmount: target,
          isLateFee: true,
          sortOrder: 999,
        },
      });
    }
    await tx.invoice.update({ where: { id: invoiceId }, data: { lateFeeCalcAt: new Date() } });
    await this.recomputeInvoice(tx, invoiceId, today);
    await this.ledger(tx, {
      schoolId: inv.schoolId,
      studentId: inv.studentId,
      academicYearId: inv.academicYearId,
      type: 'LATE_FEE',
      description: delta > 0 ? `Late fee on ${inv.invoiceNo} (${formatINR(target)} total)` : `Late fee reduced on ${inv.invoiceNo} (due date change)`,
      debit: delta > 0 ? delta : 0,
      credit: delta < 0 ? -delta : 0,
      invoiceId,
      createdById: actorId,
    });
    return delta;
  }

  /** Recompute StudentDiscount-driven discounts on an open invoice (after approval / revocation). */
  async reapplyDiscounts(tx: Tx, invoiceId: string, actorId: string | null): Promise<number> {
    await this.lockInvoice(tx, invoiceId);
    const inv = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId }, include: { lines: { orderBy: { sortOrder: 'asc' } } } });
    if (!OPEN_STATUSES.includes(inv.status as any)) return 0;
    const discounts = await tx.studentDiscount.findMany({ where: { studentId: inv.studentId, academicYearId: inv.academicYearId, status: 'APPROVED' } });
    const res = applyDiscounts(
      inv.lines.map((l) => ({ feeHeadId: l.feeHeadId, amount: l.amount - l.waiver, isLateFee: l.isLateFee })),
      discounts.map((d) => ({ id: d.id, mode: d.mode, value: d.value, feeHeadIds: d.feeHeadIds })),
    );
    let delta = 0;
    for (let i = 0; i < inv.lines.length; i++) {
      const line = inv.lines[i];
      const next = res[i].discount;
      if (next !== line.discount) {
        delta += next - line.discount;
        await tx.invoiceLine.update({ where: { id: line.id }, data: { discount: next, netAmount: Math.max(0, line.amount - next - line.waiver), discountSources: res[i].sources as Prisma.InputJsonValue } });
      }
    }
    if (delta === 0) return 0;
    await this.recomputeInvoice(tx, invoiceId);
    await this.ledger(tx, {
      schoolId: inv.schoolId,
      studentId: inv.studentId,
      academicYearId: inv.academicYearId,
      type: 'DISCOUNT',
      description: delta > 0 ? `Discount applied to ${inv.invoiceNo}` : `Discount withdrawn on ${inv.invoiceNo}`,
      credit: delta > 0 ? delta : 0,
      debit: delta < 0 ? -delta : 0,
      invoiceId,
      createdById: actorId,
    });
    await this.applyAdvanceCredit(tx, inv.studentId);
    return delta;
  }

  /** Apply an approved FeeAdjustment (waiver / correction) to its invoice. */
  async applyAdjustment(tx: Tx, adjustmentId: string, actorId: string | null) {
    const adj = await tx.feeAdjustment.findUniqueOrThrow({ where: { id: adjustmentId } });
    await this.lockInvoice(tx, adj.invoiceId);
    const inv = await tx.invoice.findUniqueOrThrow({ where: { id: adj.invoiceId }, include: { lines: { orderBy: { sortOrder: 'asc' } } } });
    if (inv.status === 'CANCELLED') throw new BadRequestException('Cannot adjust a cancelled invoice');
    const reduce = adj.type !== 'CORRECTION_INCREASE';
    let remaining = adj.amount;

    if (adj.type === 'CORRECTION_INCREASE') {
      const line = adj.invoiceLineId ? inv.lines.find((l) => l.id === adj.invoiceLineId) : undefined;
      if (line) {
        await tx.invoiceLine.update({ where: { id: line.id }, data: { amount: line.amount + adj.amount } });
      } else {
        const other = await tx.feeHead.findFirst({ where: { schoolId: inv.schoolId, category: 'OTHER' } });
        await tx.invoiceLine.create({
          data: { invoiceId: inv.id, feeHeadId: other?.id ?? inv.lines[0].feeHeadId, description: `Correction: ${adj.reason}`.slice(0, 200), amount: adj.amount, netAmount: adj.amount, sortOrder: inv.lines.length },
        });
      }
      remaining = 0;
    } else {
      const candidates =
        adj.type === 'LATE_FEE_WAIVER'
          ? inv.lines.filter((l) => l.isLateFee)
          : adj.invoiceLineId
            ? inv.lines.filter((l) => l.id === adj.invoiceLineId)
            : inv.lines.filter((l) => !l.isLateFee);
      for (const line of candidates) {
        if (remaining <= 0) break;
        const room = line.amount - line.discount - line.waiver;
        const take = Math.min(room, remaining);
        if (take <= 0) continue;
        if (adj.type === 'CORRECTION_DECREASE') await tx.invoiceLine.update({ where: { id: line.id }, data: { amount: line.amount - take } });
        else await tx.invoiceLine.update({ where: { id: line.id }, data: { waiver: line.waiver + take } });
        remaining -= take;
      }
      if (adj.type === 'LATE_FEE_WAIVER') await tx.invoice.update({ where: { id: inv.id }, data: { lateFeeFrozen: true } });
    }
    const applied = adj.amount - remaining;
    if (applied <= 0) throw new BadRequestException('Nothing left to adjust on this invoice');
    await this.recomputeInvoice(tx, inv.id);
    await this.ledger(tx, {
      schoolId: inv.schoolId,
      studentId: inv.studentId,
      academicYearId: inv.academicYearId,
      type: 'ADJUSTMENT',
      description: `${adjustmentLabel(adj.type)} on ${inv.invoiceNo} · ${adj.reason}`,
      debit: reduce ? 0 : applied,
      credit: reduce ? applied : 0,
      invoiceId: inv.id,
      adjustmentId: adj.id,
      createdById: actorId,
    });
    if (reduce) await this.applyAdvanceCredit(tx, inv.studentId);
    return applied;
  }

  /* ------------------------------------------------------------------ */
  /* Balances & integrity                                                */
  /* ------------------------------------------------------------------ */

  async studentBalances(tx: Tx, studentId: string, today = todayIST()) {
    const [open, overdue, adv, ledger] = await Promise.all([
      tx.invoice.aggregate({ where: { studentId, status: { in: [...OPEN_STATUSES] } }, _sum: { balance: true } }),
      tx.invoice.aggregate({ where: { studentId, status: { in: [...OPEN_STATUSES] }, dueDate: { lt: dateOnly(today) } }, _sum: { balance: true } }),
      tx.payment.aggregate({ where: { studentId, status: { in: COUNTING_PAYMENT } }, _sum: { unallocatedAmount: true } }),
      tx.ledgerEntry.aggregate({ where: { studentId }, _sum: { debit: true, credit: true } }),
    ]);
    const outstanding = open._sum.balance ?? 0;
    const advanceCredit = adv._sum.unallocatedAmount ?? 0;
    const ledgerNet = (ledger._sum.debit ?? 0) - (ledger._sum.credit ?? 0);
    return { outstanding, overdue: overdue._sum.balance ?? 0, advanceCredit, netDue: outstanding - advanceCredit, ledgerNet, consistent: ledgerNet === outstanding - advanceCredit };
  }

  /** Verify every invariant for a student; used by tests and the admin integrity report. */
  async integrityCheck(tx: Tx, studentId: string) {
    const problems: string[] = [];
    const invoices = await tx.invoice.findMany({ where: { studentId }, include: { lines: true } });
    for (const inv of invoices) {
      const total = inv.lines.reduce((a, l) => a + l.netAmount, 0);
      const paid = inv.lines.reduce((a, l) => a + l.amountPaid, 0);
      if (total !== inv.total) problems.push(`${inv.invoiceNo}: total ${inv.total} != lines ${total}`);
      if (paid !== inv.amountPaid) problems.push(`${inv.invoiceNo}: paid ${inv.amountPaid} != lines ${paid}`);
      if (inv.balance !== inv.total - inv.amountPaid) problems.push(`${inv.invoiceNo}: balance mismatch`);
      for (const l of inv.lines) {
        const agg = await tx.paymentAllocation.aggregate({ where: { invoiceLineId: l.id, reversedAt: null }, _sum: { amount: true } });
        if ((agg._sum.amount ?? 0) !== l.amountPaid) problems.push(`${inv.invoiceNo}/${l.description}: allocations ${agg._sum.amount} != paid ${l.amountPaid}`);
        if (l.amountPaid > l.netAmount) problems.push(`${inv.invoiceNo}/${l.description}: overpaid`);
      }
    }
    const payments = await tx.payment.findMany({ where: { studentId } });
    for (const p of payments) {
      const agg = await tx.paymentAllocation.aggregate({ where: { paymentId: p.id, reversedAt: null }, _sum: { amount: true } });
      const alloc = agg._sum.amount ?? 0;
      if (alloc !== p.allocatedAmount) problems.push(`${p.receiptNo}: allocated ${p.allocatedAmount} != ${alloc}`);
      if (COUNTING_PAYMENT.includes(p.status) && p.unallocatedAmount !== p.amount - alloc - p.refundedAmount) problems.push(`${p.receiptNo}: unallocated mismatch`);
      if (alloc + p.refundedAmount > p.amount) problems.push(`${p.receiptNo}: over-allocated`);
    }
    const b = await this.studentBalances(tx, studentId);
    if (!b.consistent) problems.push(`Ledger net ${b.ledgerNet} != outstanding ${b.outstanding} − advance ${b.advanceCredit}`);
    return { ok: problems.length === 0, problems, balances: b };
  }
}

export function modeLabel(mode: PaymentMode | string): string {
  return (
    {
      CASH: 'Cash',
      BANK_TRANSFER: 'Bank transfer',
      CHEQUE: 'Cheque',
      UPI: 'UPI',
      CARD: 'Card',
      NET_BANKING: 'Net banking',
      WALLET: 'Wallet',
      OPENING_CREDIT: 'Opening credit',
    } as Record<string, string>
  )[mode] ?? String(mode);
}

export function adjustmentLabel(t: string) {
  return ({ WAIVER: 'Waiver', LATE_FEE_WAIVER: 'Late fee waiver', DISCOUNT: 'One-time discount', CORRECTION_INCREASE: 'Correction (+)', CORRECTION_DECREASE: 'Correction (−)' } as Record<string, string>)[t] ?? t;
}

export { OPEN_STATUSES, COUNTING_PAYMENT, toISODate };
