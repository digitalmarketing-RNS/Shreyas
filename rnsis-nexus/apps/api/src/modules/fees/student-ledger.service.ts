import { Injectable, NotFoundException } from '@nestjs/common';
import { computeLateFee, MoneySummary, StudentLedgerEntryDto, todayIST, toISODate } from '@rnsis/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { DuesService } from './dues.service';
import { FeeLedgerService, COUNTING_PAYMENT } from './fee-ledger.service';

/** Real-time fee account of one student: summary, invoices, payments, full ledger timeline. */
@Injectable()
export class StudentLedgerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: FeeLedgerService,
    private readonly dues: DuesService,
  ) {}

  async summary(studentId: string): Promise<MoneySummary> {
    const [inv, pay, b] = await Promise.all([
      this.prisma.invoice.aggregate({ where: { studentId, status: { not: 'CANCELLED' } }, _sum: { subtotal: true, lateFee: true, discountTotal: true } }),
      this.prisma.payment.aggregate({ where: { studentId, status: { in: COUNTING_PAYMENT } }, _sum: { amount: true, refundedAmount: true } }),
      this.ledger.studentBalances(this.prisma, studentId),
    ]);
    return {
      billed: (inv._sum.subtotal ?? 0) + (inv._sum.lateFee ?? 0),
      discounts: inv._sum.discountTotal ?? 0,
      lateFees: inv._sum.lateFee ?? 0,
      paid: (pay._sum.amount ?? 0) - (pay._sum.refundedAmount ?? 0),
      balance: b.outstanding,
      overdue: b.overdue,
      advanceCredit: b.advanceCredit,
      netDue: b.netDue,
    };
  }

  async entries(studentId: string): Promise<StudentLedgerEntryDto[]> {
    const rows = await this.prisma.ledgerEntry.findMany({
      where: { studentId },
      include: { invoice: { select: { invoiceNo: true } }, payment: { select: { receiptNo: true } } },
      orderBy: [{ entryDate: 'asc' }, { id: 'asc' }],
    });
    let running = 0;
    return rows.map((r) => {
      running += r.debit - r.credit;
      return {
        id: r.id,
        date: r.entryDate.toISOString(),
        type: r.type,
        description: r.description,
        debit: r.debit,
        credit: r.credit,
        runningBalance: running,
        invoiceId: r.invoiceId,
        invoiceNo: r.invoice?.invoiceNo ?? null,
        paymentId: r.paymentId,
        receiptNo: r.payment?.receiptNo ?? null,
      };
    });
  }

  async account(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: { include: { grade: true, section: true, academicYear: true }, orderBy: { startDate: 'desc' }, take: 1 },
        guardians: { include: { guardian: true }, orderBy: { isPrimary: 'desc' } },
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    const today = todayIST();
    const [summary, entries, invoices, payments, discounts, adjustments, refunds, commitments, policies, reminders] = await Promise.all([
      this.summary(studentId),
      this.entries(studentId),
      this.prisma.invoice.findMany({ where: { studentId }, include: { lines: { orderBy: { sortOrder: 'asc' } }, term: { select: { name: true } } }, orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }] }),
      this.prisma.payment.findMany({
        where: { studentId },
        include: { allocations: { where: { reversedAt: null }, include: { invoice: { select: { invoiceNo: true } } } }, collectedBy: { select: { name: true } } },
        orderBy: { paidAt: 'desc' },
      }),
      this.prisma.studentDiscount.findMany({ where: { studentId }, include: { requestedBy: { select: { name: true } }, reviewedBy: { select: { name: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.feeAdjustment.findMany({ where: { studentId }, include: { invoice: { select: { invoiceNo: true } }, requestedBy: { select: { name: true } }, approvedBy: { select: { name: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.refund.findMany({ where: { studentId }, include: { payment: { select: { receiptNo: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.paymentCommitment.findMany({ where: { studentId }, include: { recordedBy: { select: { name: true } } }, orderBy: { createdAt: 'desc' } }),
      this.dues.evaluateAll(studentId),
      this.prisma.reminderLog.findMany({ where: { studentId }, orderBy: { sentAt: 'desc' }, take: 10 }),
    ]);
    // Late fee preview for open invoices (what paying today vs. later means).
    const ruleCache = new Map<string, Awaited<ReturnType<FeeLedgerService['lateFeeRule']>>>();
    const withPreview = [];
    for (const inv of invoices) {
      let lateFeePreview = 0;
      if (['PENDING', 'PARTIALLY_PAID', 'OVERDUE'].includes(inv.status) && !inv.lateFeeFrozen) {
        if (!ruleCache.has(inv.academicYearId)) ruleCache.set(inv.academicYearId, await this.ledger.lateFeeRule(this.prisma, inv.academicYearId));
        const rule = ruleCache.get(inv.academicYearId)!;
        const principal = inv.lines.filter((l) => !l.isLateFee).reduce((a, l) => a + l.netAmount - l.amountPaid, 0);
        const d7 = new Date(Math.max(Date.now(), inv.dueDate.getTime()) + (rule.graceDays + 7) * 86400_000);
        lateFeePreview = computeLateFee(rule, principal, inv.dueDate, d7).amount;
      }
      withPreview.push({ ...inv, lateFeePreview, isOverdue: inv.balance > 0 && inv.status !== 'CANCELLED' && toISODate(inv.dueDate) < today });
    }
    const e = student.enrollments[0];
    return {
      student: {
        id: student.id,
        name: [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' '),
        admissionNo: student.admissionNo,
        status: student.status,
        className: e ? `${e.grade.name}${e.section ? ` - ${e.section.name}` : ''}` : null,
        academicYear: e?.academicYear.name ?? null,
        siblingDiscountEligible: student.siblingDiscountEligible,
        guardians: student.guardians.map((g) => ({ id: g.guardian.id, name: g.guardian.name, relation: g.guardian.relation, phone: g.guardian.phone, email: g.guardian.email, isPrimary: g.isPrimary })),
      },
      summary,
      invoices: withPreview,
      payments,
      entries,
      discounts,
      adjustments,
      refunds,
      commitments,
      policies,
      reminders,
    };
  }
}
