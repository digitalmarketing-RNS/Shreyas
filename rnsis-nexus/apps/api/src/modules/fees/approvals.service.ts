import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AdjustmentType, DiscountMode, DiscountType, RefundMethod, RefundSource } from '@prisma/client';
import { formatINR } from '@rnsis/shared';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserData } from '../../common/context/auth-user';
import { AuditService } from '../../core/audit/audit.service';
import { SequenceService } from '../../core/sequence/sequence.service';
import { SchoolService } from '../../core/settings/school.service';
import { NotificationsService } from '../notifications/notifications.service';
import { adjustmentLabel, FeeLedgerService, OPEN_STATUSES } from './fee-ledger.service';
import { FeeNotifier } from './fee-notifier.service';
import { PaymentsService } from './payments.service';

const DISCOUNT_LABEL: Record<DiscountType, string> = {
  SIBLING: 'Sibling discount',
  STAFF_CHILD: 'Staff child discount',
  MERIT_SCHOLARSHIP: 'Merit scholarship',
  SPECIAL_CONCESSION: 'Special concession',
  OTHER: 'Concession',
};

export function describeDiscount(d: { mode: DiscountMode; value: number }) {
  return d.mode === 'PERCENT' ? `${(d.value / 100).toFixed(2).replace(/\.00$/, '')}%` : `${formatINR(d.value)} per term`;
}

/**
 * Maker–checker workflows for everything that reduces what a family owes or returns money:
 * discounts/concessions, waivers/corrections and refunds. Nothing takes effect until an
 * approver (someone other than the requester, unless Super Admin) signs off, and every
 * step is audit-logged with who, why and when.
 */
@Injectable()
export class ApprovalsService {
  private readonly logger = new Logger(ApprovalsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: FeeLedgerService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly sequences: SequenceService,
    private readonly schools: SchoolService,
    private readonly payments: PaymentsService,
    private readonly notifier: FeeNotifier,
  ) {}

  private assertChecker(actor: CurrentUserData, requestedById: string) {
    if (actor.id === requestedById && actor.roleKey !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Maker–checker: a request must be approved by someone other than the person who raised it.');
    }
  }

  /* ------------------------------ Discounts ------------------------------ */

  async requestDiscount(
    actor: CurrentUserData,
    dto: { studentId: string; academicYearId?: string; type: DiscountType; mode: DiscountMode; value: number; feeHeadIds?: string[]; reason: string; applyToOpenInvoices?: boolean },
  ) {
    const student = await this.prisma.student.findFirst({ where: { id: dto.studentId, schoolId: actor.schoolId } });
    if (!student) throw new NotFoundException('Student not found');
    if (dto.mode === 'PERCENT' && (dto.value <= 0 || dto.value > 10_000)) throw new BadRequestException('Percentage must be between 0 and 100');
    if (dto.mode === 'FIXED' && dto.value <= 0) throw new BadRequestException('Amount must be positive');
    const year = dto.academicYearId ? { id: dto.academicYearId } : await this.schools.currentYearOrThrow(actor.schoolId);
    const d = await this.prisma.studentDiscount.create({
      data: {
        schoolId: actor.schoolId,
        studentId: student.id,
        academicYearId: year.id,
        type: dto.type,
        mode: dto.mode,
        value: dto.value,
        feeHeadIds: dto.feeHeadIds ?? [],
        reason: dto.reason,
        applyToOpenInvoices: dto.applyToOpenInvoices ?? true,
        requestedById: actor.id,
      },
    });
    await this.audit.log({
      action: 'discount.requested',
      entityType: 'StudentDiscount',
      entityId: d.id,
      summary: `${DISCOUNT_LABEL[d.type]} of ${describeDiscount(d)} requested for ${student.firstName} ${student.lastName} (${student.admissionNo}): ${d.reason}`,
      after: d,
    });
    await this.notifications.notifyPermissionHolders(
      actor.schoolId,
      'fees.discount.approve',
      'Discount awaiting approval',
      `${DISCOUNT_LABEL[d.type]} ${describeDiscount(d)} for ${student.firstName} ${student.lastName} — requested by ${actor.name}`,
      '/fees/approvals',
      actor.id,
    );
    return d;
  }

  async reviewDiscount(actor: CurrentUserData, id: string, decision: 'APPROVE' | 'REJECT', notes?: string) {
    const d = await this.prisma.studentDiscount.findFirst({ where: { id, schoolId: actor.schoolId }, include: { student: true } });
    if (!d) throw new NotFoundException('Discount not found');
    if (d.status !== 'PENDING') throw new BadRequestException(`Discount is already ${d.status.toLowerCase()}`);
    this.assertChecker(actor, d.requestedById);
    if (decision === 'REJECT' && !notes) throw new BadRequestException('Give a reason for rejecting');
    let applied = 0;
    await this.prisma.tx(
      async (tx) => {
        await tx.studentDiscount.update({ where: { id }, data: { status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED', reviewedById: actor.id, reviewedAt: new Date(), reviewNotes: notes } });
        if (decision === 'APPROVE' && d.applyToOpenInvoices) {
          const open = await tx.invoice.findMany({ where: { studentId: d.studentId, academicYearId: d.academicYearId, status: { in: [...OPEN_STATUSES] } }, select: { id: true } });
          for (const inv of open) applied += await this.ledger.reapplyDiscounts(tx, inv.id, actor.id);
        }
        await this.audit.log(
          {
            action: decision === 'APPROVE' ? 'discount.approved' : 'discount.rejected',
            entityType: 'StudentDiscount',
            entityId: id,
            summary: `${DISCOUNT_LABEL[d.type]} ${describeDiscount(d)} for ${d.student.firstName} ${d.student.lastName} ${decision === 'APPROVE' ? `approved${applied ? ` (${formatINR(applied)} applied to open invoices)` : ''}` : 'rejected'}${notes ? ` — ${notes}` : ''}`,
            before: { status: 'PENDING' },
            after: { status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED', applied },
          },
          tx,
        );
        await this.notifications.notify(
          { schoolId: actor.schoolId, templateKey: 'APPROVAL_REQUIRED', channels: ['IN_APP'], to: { userId: d.requestedById }, data: { title: `Discount ${decision === 'APPROVE' ? 'approved' : 'rejected'}`, body: `${d.student.firstName} ${d.student.lastName}: ${DISCOUNT_LABEL[d.type]} ${describeDiscount(d)}`, link: `/students/${d.studentId}` } },
          tx,
        );
      },
      { timeout: 60_000 },
    );
    return { ...(await this.prisma.studentDiscount.findUniqueOrThrow({ where: { id } })), appliedToOpenInvoices: applied };
  }

  async revokeDiscount(actor: CurrentUserData, id: string, reason: string) {
    const d = await this.prisma.studentDiscount.findFirst({ where: { id, schoolId: actor.schoolId }, include: { student: true } });
    if (!d) throw new NotFoundException('Discount not found');
    if (d.status !== 'APPROVED') throw new BadRequestException('Only approved discounts can be revoked');
    await this.prisma.tx(async (tx) => {
      await tx.studentDiscount.update({ where: { id }, data: { status: 'REVOKED', reviewNotes: `Revoked: ${reason}`, reviewedById: actor.id, reviewedAt: new Date() } });
      const open = await tx.invoice.findMany({ where: { studentId: d.studentId, academicYearId: d.academicYearId, status: { in: [...OPEN_STATUSES] } }, select: { id: true } });
      for (const inv of open) await this.ledger.reapplyDiscounts(tx, inv.id, actor.id);
      await this.audit.log({ action: 'discount.revoked', entityType: 'StudentDiscount', entityId: id, summary: `${DISCOUNT_LABEL[d.type]} for ${d.student.firstName} ${d.student.lastName} revoked: ${reason}`, before: { status: 'APPROVED' }, after: { status: 'REVOKED' } }, tx);
    });
    return this.prisma.studentDiscount.findUniqueOrThrow({ where: { id } });
  }

  listDiscounts(schoolId: string, q: { status?: string; studentId?: string }) {
    return this.prisma.studentDiscount.findMany({
      where: { schoolId, ...(q.status ? { status: q.status as any } : {}), ...(q.studentId ? { studentId: q.studentId } : {}) },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        requestedBy: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
  }

  /* ------------------------------ Waivers / corrections ------------------------------ */

  async requestAdjustment(actor: CurrentUserData, dto: { invoiceId: string; invoiceLineId?: string; type: AdjustmentType; amount: number; reason: string }) {
    const inv = await this.prisma.invoice.findFirst({ where: { id: dto.invoiceId, schoolId: actor.schoolId }, include: { student: true, lines: true } });
    if (!inv) throw new NotFoundException('Invoice not found');
    if (inv.status === 'CANCELLED') throw new BadRequestException('Invoice is cancelled');
    if (dto.amount <= 0) throw new BadRequestException('Amount must be positive');
    if (dto.type === 'CORRECTION_DECREASE' && !dto.invoiceLineId) throw new BadRequestException('Choose the invoice line to correct');
    if (dto.type === 'LATE_FEE_WAIVER' && !inv.lines.some((l) => l.isLateFee && l.amount > 0)) throw new BadRequestException('This invoice has no late fee to waive');
    if (dto.type !== 'CORRECTION_INCREASE' && dto.amount > inv.total) throw new BadRequestException('Adjustment exceeds the invoice total');
    const adj = await this.prisma.feeAdjustment.create({
      data: { schoolId: actor.schoolId, studentId: inv.studentId, invoiceId: inv.id, invoiceLineId: dto.invoiceLineId, type: dto.type, amount: dto.amount, reason: dto.reason, requestedById: actor.id },
    });
    await this.audit.log({
      action: 'adjustment.requested',
      entityType: 'FeeAdjustment',
      entityId: adj.id,
      summary: `${adjustmentLabel(dto.type)} of ${formatINR(dto.amount)} requested on ${inv.invoiceNo} (${inv.student.firstName} ${inv.student.lastName}): ${dto.reason}`,
      after: adj,
    });
    await this.notifications.notifyPermissionHolders(actor.schoolId, 'fees.adjustment.approve', 'Fee adjustment awaiting approval', `${adjustmentLabel(dto.type)} ${formatINR(dto.amount)} on ${inv.invoiceNo} — ${actor.name}`, '/fees/approvals', actor.id);
    return adj;
  }

  async reviewAdjustment(actor: CurrentUserData, id: string, decision: 'APPROVE' | 'REJECT', notes?: string) {
    const adj = await this.prisma.feeAdjustment.findFirst({ where: { id, schoolId: actor.schoolId }, include: { invoice: true } });
    if (!adj) throw new NotFoundException('Adjustment not found');
    if (adj.status !== 'PENDING') throw new BadRequestException(`Adjustment is already ${adj.status.toLowerCase()}`);
    this.assertChecker(actor, adj.requestedById);
    if (decision === 'REJECT' && !notes) throw new BadRequestException('Give a reason for rejecting');
    await this.prisma.tx(async (tx) => {
      await tx.feeAdjustment.update({ where: { id }, data: { status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED', approvedById: actor.id, approvedAt: new Date(), reviewNotes: notes } });
      let applied = 0;
      if (decision === 'APPROVE') applied = await this.ledger.applyAdjustment(tx, id, actor.id);
      await this.audit.log(
        {
          action: decision === 'APPROVE' ? 'adjustment.approved' : 'adjustment.rejected',
          entityType: 'FeeAdjustment',
          entityId: id,
          summary: `${adjustmentLabel(adj.type)} ${formatINR(adj.amount)} on ${adj.invoice.invoiceNo} ${decision === 'APPROVE' ? `approved (${formatINR(applied)} applied)` : 'rejected'}${notes ? ` — ${notes}` : ''}`,
          before: { status: 'PENDING', invoiceTotal: adj.invoice.total },
          after: { status: decision, applied },
        },
        tx,
      );
    });
    return this.prisma.feeAdjustment.findUniqueOrThrow({ where: { id } });
  }

  listAdjustments(schoolId: string, q: { status?: string; studentId?: string }) {
    return this.prisma.feeAdjustment.findMany({
      where: { schoolId, ...(q.status ? { status: q.status as any } : {}), ...(q.studentId ? { studentId: q.studentId } : {}) },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        invoice: { select: { id: true, invoiceNo: true, title: true, total: true } },
        requestedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
  }

  /* ------------------------------ Refunds ------------------------------ */

  async requestRefund(actor: CurrentUserData, dto: { paymentId: string; amount: number; source: RefundSource; method: RefundMethod; reason: string }) {
    const p = await this.prisma.payment.findFirst({ where: { id: dto.paymentId, schoolId: actor.schoolId }, include: { student: true } });
    if (!p) throw new NotFoundException('Payment not found');
    if (p.status !== 'SUCCESS') throw new BadRequestException('Only successful (cleared) payments can be refunded');
    const pending = await this.prisma.refund.aggregate({ where: { paymentId: p.id, status: { in: ['REQUESTED', 'APPROVED'] } }, _sum: { amount: true } });
    const reserved = pending._sum.amount ?? 0;
    const max = dto.source === 'WALLET' ? p.unallocatedAmount - reserved : p.amount - p.refundedAmount - reserved;
    if (dto.amount <= 0 || dto.amount > max) throw new BadRequestException(`Refundable amount from this ${dto.source === 'WALLET' ? 'advance credit' : 'payment'} is ${formatINR(Math.max(0, max))}`);
    if (dto.method === 'ORIGINAL_GATEWAY' && !p.gateway) throw new BadRequestException('Original-method refunds are only possible for online payments');
    const year = await this.schools.currentYearOrThrow(actor.schoolId);
    const { settings } = await this.schools.get(actor.schoolId);
    const refund = await this.prisma.tx(async (tx) => {
      const refundNo = await this.sequences.nextFormatted(tx, actor.schoolId, 'REFUND', year.name, settings.numbering.refundPrefix);
      return tx.refund.create({ data: { schoolId: actor.schoolId, refundNo, studentId: p.studentId, paymentId: p.id, amount: dto.amount, source: dto.source, method: dto.method, reason: dto.reason, requestedById: actor.id } });
    });
    await this.audit.log({ action: 'refund.requested', entityType: 'Refund', entityId: refund.id, summary: `${refund.refundNo}: refund of ${formatINR(dto.amount)} requested against ${p.receiptNo} (${p.student.firstName} ${p.student.lastName}): ${dto.reason}`, after: refund });
    await this.notifications.notifyPermissionHolders(actor.schoolId, 'fees.refund.approve', 'Refund awaiting approval', `${refund.refundNo} · ${formatINR(dto.amount)} · ${p.student.firstName} ${p.student.lastName}`, '/fees/approvals', actor.id);
    return refund;
  }

  async reviewRefund(actor: CurrentUserData, id: string, decision: 'APPROVE' | 'REJECT', notes?: string) {
    const r = await this.prisma.refund.findFirst({ where: { id, schoolId: actor.schoolId } });
    if (!r) throw new NotFoundException('Refund not found');
    if (r.status !== 'REQUESTED') throw new BadRequestException(`Refund is already ${r.status.toLowerCase()}`);
    this.assertChecker(actor, r.requestedById);
    if (decision === 'REJECT' && !notes) throw new BadRequestException('Give a reason for rejecting');
    const updated = await this.prisma.refund.update({
      where: { id },
      data: decision === 'APPROVE' ? { status: 'APPROVED', approvedById: actor.id, approvedAt: new Date() } : { status: 'REJECTED', approvedById: actor.id, approvedAt: new Date(), rejectedReason: notes },
    });
    await this.audit.log({ action: decision === 'APPROVE' ? 'refund.approved' : 'refund.rejected', entityType: 'Refund', entityId: id, summary: `${r.refundNo} ${decision === 'APPROVE' ? 'approved' : `rejected: ${notes}`}`, before: { status: r.status }, after: { status: updated.status } });
    return updated;
  }

  /** Pay out an approved refund (gateway reversal or manual), then post it to the ledger. */
  async processRefund(actor: CurrentUserData, id: string, dto: { referenceNo?: string }) {
    const r = await this.prisma.refund.findFirst({ where: { id, schoolId: actor.schoolId }, include: { payment: true } });
    if (!r) throw new NotFoundException('Refund not found');
    if (r.status !== 'APPROVED') throw new BadRequestException('Refund must be approved before processing');
    let gatewayRefundId: string | null = null;
    if (r.method === 'ORIGINAL_GATEWAY') {
      if (!r.payment.gateway || !r.payment.gatewayPaymentId) throw new BadRequestException('Payment has no gateway reference');
      try {
        gatewayRefundId = (await this.payments.gateway(r.payment.gateway).refund(r.payment.gatewayPaymentId, r.amount, { refundNo: r.refundNo })).refundId;
      } catch (e: any) {
        await this.prisma.refund.update({ where: { id }, data: { status: 'FAILED', rejectedReason: `Gateway error: ${e.message}` } });
        await this.audit.log({ action: 'refund.failed', entityType: 'Refund', entityId: id, summary: `${r.refundNo} gateway reversal failed: ${e.message}` });
        throw new BadRequestException(`Gateway refund failed: ${e.message}`);
      }
    } else if (!dto.referenceNo && r.method !== 'CASH') {
      throw new BadRequestException('Enter the bank / cheque reference for this refund');
    }
    await this.prisma.tx(async (tx) => {
      const p = await tx.payment.findUniqueOrThrow({ where: { id: r.paymentId } });
      if (r.source === 'WALLET' && p.unallocatedAmount < r.amount) throw new BadRequestException('Advance credit is no longer available on this payment');
      if (r.source === 'PAYMENT') await this.ledger.releaseForRefund(tx, p.id, r.amount);
      await tx.payment.update({ where: { id: p.id }, data: { refundedAmount: { increment: r.amount } } });
      await this.ledger.recomputePayment(tx, p.id);
      await tx.refund.update({ where: { id }, data: { status: 'PROCESSED', processedAt: new Date(), processedById: actor.id, gatewayRefundId, referenceNo: dto.referenceNo ?? gatewayRefundId } });
      await this.ledger.ledger(tx, {
        schoolId: r.schoolId,
        studentId: r.studentId,
        academicYearId: p.academicYearId,
        type: 'REFUND',
        description: `${r.refundNo} · refund against ${p.receiptNo} (${r.method.replace(/_/g, ' ').toLowerCase()})`,
        debit: r.amount,
        paymentId: p.id,
        refundId: r.id,
        createdById: actor.id,
      });
      await this.audit.log(
        { action: 'refund.processed', entityType: 'Refund', entityId: id, summary: `${r.refundNo}: ${formatINR(r.amount)} refunded via ${r.method}${gatewayRefundId ? ` (gateway ${gatewayRefundId})` : ''}`, after: { gatewayRefundId, referenceNo: dto.referenceNo } },
        tx,
      );
    });
    await this.notifier.refundProcessed(id).catch((e) => this.logger.warn(e.message));
    return this.prisma.refund.findUniqueOrThrow({ where: { id } });
  }

  listRefunds(schoolId: string, q: { status?: string; studentId?: string }) {
    return this.prisma.refund.findMany({
      where: { schoolId, ...(q.status ? { status: q.status as any } : {}), ...(q.studentId ? { studentId: q.studentId } : {}) },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        payment: { select: { id: true, receiptNo: true, amount: true, mode: true, gateway: true } },
        requestedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
  }

  async pendingCounts(schoolId: string) {
    const [discounts, adjustments, refunds, refundsToProcess, cheques] = await Promise.all([
      this.prisma.studentDiscount.count({ where: { schoolId, status: 'PENDING' } }),
      this.prisma.feeAdjustment.count({ where: { schoolId, status: 'PENDING' } }),
      this.prisma.refund.count({ where: { schoolId, status: 'REQUESTED' } }),
      this.prisma.refund.count({ where: { schoolId, status: 'APPROVED' } }),
      this.prisma.payment.count({ where: { schoolId, status: 'PENDING_CLEARANCE' } }),
    ]);
    return { discounts, adjustments, refunds, refundsToProcess, cheques, total: discounts + adjustments + refunds };
  }
}
