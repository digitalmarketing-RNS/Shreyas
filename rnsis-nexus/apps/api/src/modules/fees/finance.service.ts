import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { addDays, dateOnly, formatDateIN, formatINR, todayIST, toISODate } from '@rnsis/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportTable } from '../../core/excel/excel.service';
import { SchoolService } from '../../core/settings/school.service';
import { ApprovalsService } from './approvals.service';
import { DuesService } from './dues.service';
import { modeLabel } from './fee-ledger.service';

export type CollectionGroup = 'day' | 'week' | 'month' | 'term' | 'year' | 'mode' | 'feeHead' | 'grade' | 'section' | 'collector';

const istStart = (d: string) => new Date(`${d}T00:00:00.000+05:30`);
const istEnd = (d: string) => new Date(`${d}T23:59:59.999+05:30`);
const num = (v: unknown) => Number(v ?? 0);
const IST = Prisma.raw(`'Asia/Kolkata'`);

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly schools: SchoolService,
    private readonly dues: DuesService,
    private readonly approvals: ApprovalsService,
  ) {}

  private async currentTerm(schoolId: string) {
    const year = await this.schools.currentYear(schoolId);
    if (!year) return { year: null, term: null, terms: [] };
    const terms = await this.prisma.term.findMany({ where: { academicYearId: year.id }, orderBy: { sequence: 'asc' } });
    const today = todayIST();
    const term = terms.find((t) => toISODate(t.startDate) <= today && toISODate(t.endDate) >= today) ?? terms.filter((t) => toISODate(t.startDate) <= today).pop() ?? terms[0] ?? null;
    return { year, term, terms };
  }

  /* ------------------------------ Dashboard ------------------------------ */

  async dashboard(schoolId: string) {
    const today = todayIST();
    const { year, term, terms } = await this.currentTerm(schoolId);
    const counting = { in: ['SUCCESS', 'PENDING_CLEARANCE'] as ('SUCCESS' | 'PENDING_CLEARANCE')[] };
    const open = { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] as ('PENDING' | 'PARTIALLY_PAID' | 'OVERDUE')[] };

    const [todayByMode, termInv, yearInv, outstanding, overdue, advance, cheques, trend, monthly, byGradeRows, aging, pending, recent, gateway] = await Promise.all([
      this.prisma.payment.groupBy({ by: ['mode'], where: { schoolId, status: counting, paidAt: { gte: istStart(today), lte: istEnd(today) } }, _sum: { amount: true }, _count: true }),
      term ? this.prisma.invoice.aggregate({ where: { schoolId, termId: term.id, status: { not: 'CANCELLED' } }, _sum: { total: true, amountPaid: true, balance: true }, _count: true }) : null,
      year ? this.prisma.invoice.aggregate({ where: { schoolId, academicYearId: year.id, status: { not: 'CANCELLED' } }, _sum: { total: true, amountPaid: true, balance: true } }) : null,
      this.prisma.invoice.aggregate({ where: { schoolId, status: open }, _sum: { balance: true }, _count: true }),
      this.prisma.invoice.aggregate({ where: { schoolId, status: open, dueDate: { lt: dateOnly(today) } }, _sum: { balance: true }, _count: true }),
      this.prisma.payment.aggregate({ where: { schoolId, status: counting }, _sum: { unallocatedAmount: true } }),
      this.prisma.payment.aggregate({ where: { schoolId, status: 'PENDING_CLEARANCE' }, _sum: { amount: true }, _count: true }),
      this.prisma.$queryRaw<{ day: string; amount: bigint; count: number }[]>`
        SELECT to_char(("paidAt" AT TIME ZONE ${IST})::date, 'YYYY-MM-DD') AS day, SUM("amount")::bigint AS amount, COUNT(*)::int AS count
          FROM "Payment" WHERE "schoolId" = ${schoolId} AND "status" IN ('SUCCESS','PENDING_CLEARANCE') AND "paidAt" >= ${istStart(addDays(today, -29))}
         GROUP BY 1 ORDER BY 1`,
      year
        ? this.prisma.$queryRaw<{ month: string; amount: bigint }[]>`
        SELECT to_char(("paidAt" AT TIME ZONE ${IST}), 'YYYY-MM') AS month, SUM("amount")::bigint AS amount
          FROM "Payment" WHERE "schoolId" = ${schoolId} AND "status" IN ('SUCCESS','PENDING_CLEARANCE') AND "paidAt" >= ${istStart(toISODate(year.startDate))} AND "paidAt" <= ${istEnd(toISODate(year.endDate))}
         GROUP BY 1 ORDER BY 1`
        : [],
      year
        ? this.prisma.$queryRaw<{ grade: string; order: number; billed: bigint; collected: bigint; outstanding: bigint; students: number }[]>`
        SELECT g."name" AS grade, g."order" AS "order", COALESCE(SUM(i."total"),0)::bigint AS billed, COALESCE(SUM(i."amountPaid"),0)::bigint AS collected,
               COALESCE(SUM(i."balance"),0)::bigint AS outstanding, COUNT(DISTINCT i."studentId")::int AS students
          FROM "Invoice" i JOIN "Enrollment" e ON e."studentId" = i."studentId" AND e."academicYearId" = i."academicYearId"
          JOIN "Grade" g ON g."id" = e."gradeId"
         WHERE i."schoolId" = ${schoolId} AND i."academicYearId" = ${year.id} AND i."status" <> 'CANCELLED'
         GROUP BY g."name", g."order" ORDER BY g."order"`
        : [],
      this.dues.aging(schoolId),
      this.approvals.pendingCounts(schoolId),
      this.prisma.payment.findMany({
        where: { schoolId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } } },
      }),
      this.prisma.gatewayOrder.groupBy({ by: ['status'], where: { schoolId, createdAt: { gte: istStart(addDays(today, -6)) } }, _count: true }),
    ]);

    const trendMap = new Map(trend.map((t) => [t.day, t]));
    const trend30 = Array.from({ length: 30 }, (_, i) => {
      const d = addDays(today, i - 29);
      const t = trendMap.get(d);
      return { date: d, amount: num(t?.amount), count: t?.count ?? 0 };
    });
    const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);
    const todayAmount = todayByMode.reduce((a, m) => a + (m._sum.amount ?? 0), 0);
    return {
      asOf: new Date().toISOString(),
      today: { date: today, amount: todayAmount, count: todayByMode.reduce((a, m) => a + m._count, 0), byMode: todayByMode.map((m) => ({ mode: m.mode, label: modeLabel(m.mode), amount: m._sum.amount ?? 0, count: m._count })) },
      currentTerm: term
        ? {
            id: term.id,
            name: term.name,
            dueDate: toISODate(term.dueDate),
            invoices: termInv?._count ?? 0,
            billed: termInv?._sum.total ?? 0,
            collected: termInv?._sum.amountPaid ?? 0,
            outstanding: termInv?._sum.balance ?? 0,
            collectionPct: pct(termInv?._sum.amountPaid ?? 0, termInv?._sum.total ?? 0),
          }
        : null,
      terms: terms.map((t) => ({ id: t.id, name: t.name, dueDate: toISODate(t.dueDate), startDate: toISODate(t.startDate), endDate: toISODate(t.endDate) })),
      year: year
        ? { id: year.id, name: year.name, billed: yearInv?._sum.total ?? 0, collected: yearInv?._sum.amountPaid ?? 0, outstanding: yearInv?._sum.balance ?? 0, collectionPct: pct(yearInv?._sum.amountPaid ?? 0, yearInv?._sum.total ?? 0) }
        : null,
      outstanding: { amount: outstanding._sum.balance ?? 0, invoices: outstanding._count },
      overdue: { amount: overdue._sum.balance ?? 0, invoices: overdue._count },
      advanceCredit: advance._sum.unallocatedAmount ?? 0,
      pendingCheques: { amount: cheques._sum.amount ?? 0, count: cheques._count },
      trend30,
      monthly: monthly.map((m) => ({ month: m.month, amount: num(m.amount) })),
      byGrade: byGradeRows.map((g) => ({ grade: g.grade, billed: num(g.billed), collected: num(g.collected), outstanding: num(g.outstanding), students: g.students, collectionPct: pct(num(g.collected), num(g.billed)) })),
      aging,
      pendingApprovals: pending,
      onlineOrders7d: gateway.map((g) => ({ status: g.status, count: g._count })),
      recentPayments: recent.map((p) => ({
        id: p.id,
        receiptNo: p.receiptNo,
        amount: p.amount,
        mode: p.mode,
        status: p.status,
        channel: p.channel,
        paidAt: p.paidAt,
        student: { id: p.student.id, name: `${p.student.firstName} ${p.student.lastName}`, admissionNo: p.student.admissionNo },
      })),
    };
  }

  /* ------------------------------ Collections report ------------------------------ */

  async collections(schoolId: string, q: { from: string; to: string; groupBy: CollectionGroup; mode?: string; gradeId?: string }): Promise<ReportTable> {
    if (q.from > q.to) throw new BadRequestException('"From" date must be before "To" date');
    const conds: Prisma.Sql[] = [
      Prisma.sql`p."schoolId" = ${schoolId}`,
      Prisma.sql`p."status" IN ('SUCCESS','PENDING_CLEARANCE')`,
      Prisma.sql`p."paidAt" >= ${istStart(q.from)}`,
      Prisma.sql`p."paidAt" <= ${istEnd(q.to)}`,
    ];
    if (q.mode) conds.push(Prisma.sql`p."mode" = ${q.mode}::"PaymentMode"`);
    if (q.gradeId) conds.push(Prisma.sql`e."gradeId" = ${q.gradeId}`);
    const where = Prisma.join(conds, ' AND ');
    const enrollmentJoin = Prisma.sql`LEFT JOIN "Enrollment" e ON e."studentId" = p."studentId" AND e."academicYearId" = p."academicYearId"`;

    let rows: { key: string; label: string; amount: number; count: number }[];
    if (q.groupBy === 'feeHead') {
      const r = await this.prisma.$queryRaw<{ key: string; label: string; amount: bigint; count: number }[]>`
        SELECT fh."code" AS key, fh."name" AS label, SUM(a."amount")::bigint AS amount, COUNT(DISTINCT p."id")::int AS count
          FROM "PaymentAllocation" a JOIN "Payment" p ON p."id" = a."paymentId" JOIN "InvoiceLine" l ON l."id" = a."invoiceLineId"
          JOIN "FeeHead" fh ON fh."id" = l."feeHeadId" ${enrollmentJoin}
         WHERE ${where} AND a."reversedAt" IS NULL
         GROUP BY fh."code", fh."name", fh."priority" ORDER BY fh."priority"`;
      const adv = await this.prisma.$queryRaw<{ amount: bigint; count: number }[]>`
        SELECT COALESCE(SUM(p."unallocatedAmount"),0)::bigint AS amount, COUNT(*) FILTER (WHERE p."unallocatedAmount" > 0)::int AS count
          FROM "Payment" p ${enrollmentJoin} WHERE ${where}`;
      rows = r.map((x) => ({ key: x.key, label: x.label, amount: num(x.amount), count: x.count }));
      if (num(adv[0]?.amount) > 0) rows.push({ key: 'ADVANCE', label: 'Advance credit (not yet applied)', amount: num(adv[0].amount), count: adv[0].count });
    } else {
      const keyExpr: Record<Exclude<CollectionGroup, 'feeHead'>, Prisma.Sql> = {
        day: Prisma.sql`to_char((p."paidAt" AT TIME ZONE ${IST})::date, 'YYYY-MM-DD')`,
        week: Prisma.sql`to_char(date_trunc('week', p."paidAt" AT TIME ZONE ${IST})::date, 'YYYY-MM-DD')`,
        month: Prisma.sql`to_char((p."paidAt" AT TIME ZONE ${IST}), 'YYYY-MM')`,
        term: Prisma.sql`COALESCE((SELECT t."name" FROM "Term" t WHERE t."academicYearId" = p."academicYearId" AND (p."paidAt" AT TIME ZONE ${IST})::date BETWEEN t."startDate" AND t."endDate" LIMIT 1), 'Outside term')`,
        year: Prisma.sql`(SELECT y."name" FROM "AcademicYear" y WHERE y."id" = p."academicYearId")`,
        mode: Prisma.sql`p."mode"::text`,
        grade: Prisma.sql`COALESCE((SELECT g."name" FROM "Grade" g WHERE g."id" = e."gradeId"), 'Unassigned')`,
        section: Prisma.sql`COALESCE((SELECT g."name" || ' - ' || s."name" FROM "Section" s JOIN "Grade" g ON g."id" = s."gradeId" WHERE s."id" = e."sectionId"), 'Unassigned')`,
        collector: Prisma.sql`COALESCE((SELECT u."name" FROM "User" u WHERE u."id" = p."collectedById"), 'Online (self-service)')`,
      };
      const r = await this.prisma.$queryRaw<{ key: string; amount: bigint; count: number }[]>`
        SELECT ${keyExpr[q.groupBy]} AS key, SUM(p."amount")::bigint AS amount, COUNT(*)::int AS count
          FROM "Payment" p ${enrollmentJoin} WHERE ${where} GROUP BY 1 ORDER BY 1`;
      rows = r.map((x) => ({
        key: x.key,
        label: q.groupBy === 'mode' ? modeLabel(x.key) : q.groupBy === 'day' ? formatDateIN(x.key) : q.groupBy === 'week' ? `Week of ${formatDateIN(x.key)}` : q.groupBy === 'month' ? monthLabel(x.key) : x.key,
        amount: num(x.amount),
        count: x.count,
      }));
    }
    const total = rows.reduce((a, r) => a + r.amount, 0);
    const groupLabel: Record<CollectionGroup, string> = { day: 'Date', week: 'Week', month: 'Month', term: 'Term', year: 'Academic year', mode: 'Payment mode', feeHead: 'Fee head', grade: 'Grade', section: 'Class', collector: 'Collected by' };
    return {
      title: 'Fee Collections',
      subtitle: `by ${groupLabel[q.groupBy].toLowerCase()}`,
      filters: [
        ['Period', `${formatDateIN(q.from)} – ${formatDateIN(q.to)}`],
        ...(q.mode ? ([['Mode', modeLabel(q.mode)]] as [string, string][]) : []),
      ],
      columns: [
        { key: 'label', header: groupLabel[q.groupBy], width: 28 },
        { key: 'count', header: q.groupBy === 'feeHead' ? 'Receipts' : 'Payments', kind: 'number' },
        { key: 'amount', header: 'Amount', kind: 'money' },
        { key: 'share', header: 'Share', kind: 'percent' },
      ],
      rows: rows.map((r) => ({ ...r, share: total ? Math.round((r.amount / total) * 10000) / 100 : 0 })),
      totals: { label: 'Total', count: rows.reduce((a, r) => a + r.count, 0), amount: total, share: 100 },
    };
  }

  /** Receipt-level day book split by mode, with online reconciliation status. */
  async dailyCollection(schoolId: string, date: string): Promise<ReportTable & { byMode: { mode: string; label: string; amount: number; count: number }[] }> {
    const payments = await this.prisma.payment.findMany({
      where: { schoolId, paidAt: { gte: istStart(date), lte: istEnd(date) } },
      include: { student: { select: { firstName: true, lastName: true, admissionNo: true } }, collectedBy: { select: { name: true } } },
      orderBy: { paidAt: 'asc' },
    });
    const counting = payments.filter((p) => p.status === 'SUCCESS' || p.status === 'PENDING_CLEARANCE');
    const modes = ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'UPI', 'CARD', 'NET_BANKING', 'WALLET'];
    const byMode = modes.map((m) => ({ mode: m, label: modeLabel(m), amount: counting.filter((p) => p.mode === m).reduce((a, p) => a + p.amount, 0), count: counting.filter((p) => p.mode === m).length }));
    const recon = await this.prisma.reconciliationItem.findMany({ where: { paymentId: { in: payments.map((p) => p.id) } }, orderBy: { id: 'desc' } });
    return {
      title: 'Daily Collection Report',
      subtitle: formatDateIN(date),
      filters: byMode.filter((m) => m.count).map((m) => [m.label, `${formatINR(m.amount)} (${m.count})`] as [string, string]),
      columns: [
        { key: 'time', header: 'Time' },
        { key: 'receiptNo', header: 'Receipt No.', width: 20 },
        { key: 'student', header: 'Student', width: 24 },
        { key: 'admissionNo', header: 'Adm. No.', width: 16 },
        { key: 'mode', header: 'Mode' },
        { key: 'reference', header: 'Reference', width: 22 },
        { key: 'status', header: 'Status' },
        { key: 'collector', header: 'Collected by', width: 18 },
        { key: 'recon', header: 'Reconciled' },
        { key: 'amount', header: 'Amount', kind: 'money' },
      ],
      rows: payments.map((p) => ({
        time: new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }).format(p.paidAt),
        receiptNo: p.receiptNo,
        student: `${p.student.firstName} ${p.student.lastName}`,
        admissionNo: p.student.admissionNo,
        mode: modeLabel(p.mode),
        reference: p.gatewayPaymentId ?? p.referenceNo ?? (p.chequeNo ? `Chq ${p.chequeNo} ${p.chequeBank ?? ''}` : ''),
        status: p.status === 'PENDING_CLEARANCE' ? 'Cheque pending' : p.status,
        collector: p.collectedBy?.name ?? 'Online',
        recon: p.gateway ? recon.find((r) => r.paymentId === p.id)?.status ?? 'Not yet run' : '—',
        amount: p.status === 'SUCCESS' || p.status === 'PENDING_CLEARANCE' ? p.amount : 0,
      })),
      totals: { receiptNo: `${counting.length} receipts`, amount: counting.reduce((a, p) => a + p.amount, 0) },
      byMode,
    };
  }

  /* ------------------------------ Outstanding / forecast ------------------------------ */

  async outstanding(schoolId: string, q: { gradeId?: string; sectionId?: string; overdueOnly?: boolean }): Promise<ReportTable> {
    const today = todayIST();
    const year = await this.schools.currentYear(schoolId);
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT s."admissionNo", s."firstName" || ' ' || s."lastName" AS name, g."name" AS grade, sec."name" AS section,
             SUM(i."total")::bigint AS billed, SUM(i."amountPaid")::bigint AS paid, SUM(i."balance")::bigint AS balance,
             SUM(i."balance") FILTER (WHERE i."dueDate" < ${today}::date)::bigint AS overdue,
             MIN(i."dueDate") FILTER (WHERE i."dueDate" < ${today}::date) AS oldest
        FROM "Invoice" i JOIN "Student" s ON s."id" = i."studentId"
        LEFT JOIN "Enrollment" e ON e."studentId" = s."id" AND e."academicYearId" = ${year?.id ?? ''}
        LEFT JOIN "Grade" g ON g."id" = e."gradeId" LEFT JOIN "Section" sec ON sec."id" = e."sectionId"
       WHERE i."schoolId" = ${schoolId} AND i."status" IN ('PENDING','PARTIALLY_PAID','OVERDUE') AND i."balance" > 0
         ${q.gradeId ? Prisma.sql`AND e."gradeId" = ${q.gradeId}` : Prisma.empty}
         ${q.sectionId ? Prisma.sql`AND e."sectionId" = ${q.sectionId}` : Prisma.empty}
       GROUP BY s."id", g."name", g."order", sec."name"
       ${q.overdueOnly ? Prisma.sql`HAVING SUM(i."balance") FILTER (WHERE i."dueDate" < ${today}::date) > 0` : Prisma.empty}
       ORDER BY g."order" NULLS LAST, sec."name", name`;
    const mapped = rows.map((r) => ({
      admissionNo: r.admissionNo,
      name: r.name,
      className: r.grade ? `${r.grade}${r.section ? ` - ${r.section}` : ''}` : '—',
      billed: num(r.billed),
      paid: num(r.paid),
      balance: num(r.balance),
      overdue: num(r.overdue),
      oldest: r.oldest ? toISODate(r.oldest) : '',
    }));
    return {
      title: q.overdueOnly ? 'Overdue Fees Report' : 'Outstanding Fees Report',
      subtitle: `as of ${formatDateIN(today)}`,
      columns: [
        { key: 'admissionNo', header: 'Adm. No.', width: 16 },
        { key: 'name', header: 'Student', width: 26 },
        { key: 'className', header: 'Class', width: 14 },
        { key: 'billed', header: 'Billed (open)', kind: 'money' },
        { key: 'paid', header: 'Paid', kind: 'money' },
        { key: 'balance', header: 'Balance', kind: 'money' },
        { key: 'overdue', header: 'Overdue', kind: 'money' },
        { key: 'oldest', header: 'Oldest due', kind: 'date' },
      ],
      rows: mapped,
      totals: { name: `${mapped.length} students`, billed: mapped.reduce((a, r) => a + r.billed, 0), paid: mapped.reduce((a, r) => a + r.paid, 0), balance: mapped.reduce((a, r) => a + r.balance, 0), overdue: mapped.reduce((a, r) => a + r.overdue, 0) },
    };
  }

  /** Revenue forecast per term: billed/collected so far + projected billing for terms not yet invoiced. */
  async forecast(schoolId: string, academicYearId?: string): Promise<ReportTable> {
    const year = academicYearId ? await this.prisma.academicYear.findFirstOrThrow({ where: { id: academicYearId, schoolId } }) : await this.schools.currentYearOrThrow(schoolId);
    const terms = await this.prisma.term.findMany({ where: { academicYearId: year.id }, orderBy: { sequence: 'asc' } });
    const [enrollByGrade, structures, invAgg] = await Promise.all([
      this.prisma.enrollment.groupBy({ by: ['gradeId'], where: { academicYearId: year.id, status: 'ACTIVE', student: { status: 'ACTIVE' } }, _count: true }),
      this.prisma.feeStructure.findMany({ where: { academicYearId: year.id }, include: { items: true } }),
      this.prisma.invoice.groupBy({ by: ['termId'], where: { academicYearId: year.id, status: { not: 'CANCELLED' } }, _sum: { total: true, amountPaid: true, balance: true }, _count: true }),
    ]);
    const totalActive = enrollByGrade.reduce((a, g) => a + g._count, 0);
    const paidRate = (() => {
      const billed = invAgg.reduce((a, r) => a + (r._sum.total ?? 0), 0);
      const paid = invAgg.reduce((a, r) => a + (r._sum.amountPaid ?? 0), 0);
      return billed ? paid / billed : 0.9;
    })();
    const rows = terms.map((t) => {
      const inv = invAgg.find((r) => r.termId === t.id);
      const expected = enrollByGrade.reduce((sum, g) => {
        const s = structures.find((x) => x.gradeId === g.gradeId);
        if (!s) return sum;
        const perStudent = s.items
          .filter((i) => !i.isOptional && (i.frequency === 'PER_TERM' || (i.frequency === 'ANNUAL' && (i.termId ? i.termId === t.id : t.sequence === 1))) && i.applicability !== 'NEW_ADMISSION')
          .reduce((a, i) => a + i.amount, 0);
        return sum + perStudent * g._count;
      }, 0);
      const billed = inv?._sum.total ?? 0;
      const projected = Math.max(billed, expected);
      return {
        term: t.name,
        dueDate: toISODate(t.dueDate),
        invoices: inv?._count ?? 0,
        billed,
        collected: inv?._sum.amountPaid ?? 0,
        outstanding: inv?._sum.balance ?? 0,
        projectedBilling: projected,
        projectedCollection: Math.round((inv?._sum.amountPaid ?? 0) + (projected - (inv?._sum.amountPaid ?? 0)) * paidRate),
        status: t.invoicesGeneratedAt || billed ? 'Invoiced' : 'Projected',
      };
    });
    return {
      title: 'Revenue Forecast',
      subtitle: year.name,
      filters: [
        ['Active students', String(totalActive)],
        ['Historical collection rate', `${Math.round(paidRate * 1000) / 10}%`],
      ],
      columns: [
        { key: 'term', header: 'Term' },
        { key: 'dueDate', header: 'Due date', kind: 'date' },
        { key: 'status', header: 'Status' },
        { key: 'invoices', header: 'Invoices', kind: 'number' },
        { key: 'billed', header: 'Billed', kind: 'money' },
        { key: 'collected', header: 'Collected', kind: 'money' },
        { key: 'outstanding', header: 'Outstanding', kind: 'money' },
        { key: 'projectedBilling', header: 'Projected billing', kind: 'money' },
        { key: 'projectedCollection', header: 'Projected collection', kind: 'money' },
      ],
      rows,
      totals: {
        term: 'Year total',
        invoices: rows.reduce((a, r) => a + r.invoices, 0),
        billed: rows.reduce((a, r) => a + r.billed, 0),
        collected: rows.reduce((a, r) => a + r.collected, 0),
        outstanding: rows.reduce((a, r) => a + r.outstanding, 0),
        projectedBilling: rows.reduce((a, r) => a + r.projectedBilling, 0),
        projectedCollection: rows.reduce((a, r) => a + r.projectedCollection, 0),
      },
    };
  }

  /* ------------------------------ Fee adjustment audit report ------------------------------ */

  async adjustmentAudit(schoolId: string, q: { from: string; to: string }): Promise<ReportTable> {
    const range = { gte: istStart(q.from), lte: istEnd(q.to) };
    const [discounts, adjustments, refunds, dueDates, overrides, reversals, cancellations] = await Promise.all([
      this.prisma.studentDiscount.findMany({ where: { schoolId, createdAt: range }, include: { student: true, requestedBy: true, reviewedBy: true } }),
      this.prisma.feeAdjustment.findMany({ where: { schoolId, createdAt: range }, include: { student: true, invoice: true, requestedBy: true, approvedBy: true } }),
      this.prisma.refund.findMany({ where: { schoolId, createdAt: range }, include: { student: true, requestedBy: true, approvedBy: true } }),
      this.prisma.dueDateChange.findMany({ where: { schoolId, createdAt: range }, include: { term: true, invoice: true, changedBy: true } }),
      this.prisma.policyOverride.findMany({ where: { schoolId, createdAt: range }, include: { student: true, grantedBy: true } }),
      this.prisma.payment.findMany({ where: { schoolId, status: { in: ['BOUNCED', 'VOID'] }, OR: [{ bouncedAt: range }, { voidedAt: range }] }, include: { student: true } }),
      this.prisma.invoice.findMany({ where: { schoolId, status: 'CANCELLED', cancelledAt: range }, include: { student: true } }),
    ]);
    const users = await this.prisma.user.findMany({ where: { id: { in: [...reversals.map((r) => r.collectedById), ...cancellations.map((c) => c.cancelledById)].filter(Boolean) as string[] } }, select: { id: true, name: true } });
    const uname = (id?: string | null) => users.find((u) => u.id === id)?.name ?? '—';
    const name = (s: { firstName: string; lastName: string; admissionNo: string }) => `${s.firstName} ${s.lastName} (${s.admissionNo})`;
    const rows: Record<string, unknown>[] = [
      ...discounts.map((d) => ({ date: d.createdAt, kind: `Discount · ${d.type.replace(/_/g, ' ').toLowerCase()}`, student: name(d.student), amount: d.mode === 'FIXED' ? d.value : null, detail: d.mode === 'PERCENT' ? `${d.value / 100}%` : 'per term', reason: d.reason, requestedBy: d.requestedBy.name, approvedBy: d.reviewedBy?.name ?? '', status: d.status })),
      ...adjustments.map((a) => ({ date: a.createdAt, kind: `Adjustment · ${a.type.replace(/_/g, ' ').toLowerCase()}`, student: name(a.student), amount: a.amount, detail: a.invoice.invoiceNo, reason: a.reason, requestedBy: a.requestedBy.name, approvedBy: a.approvedBy?.name ?? '', status: a.status })),
      ...refunds.map((r) => ({ date: r.createdAt, kind: 'Refund', student: name(r.student), amount: r.amount, detail: `${r.refundNo} · ${r.method}`, reason: r.reason, requestedBy: r.requestedBy.name, approvedBy: r.approvedBy?.name ?? '', status: r.status })),
      ...dueDates.map((d) => ({ date: d.createdAt, kind: 'Due date change', student: d.term ? `${d.term.name} (${d.affectedInvoices} invoices)` : d.invoice?.invoiceNo ?? '', amount: d.lateFeeDelta || null, detail: `${formatDateIN(d.oldDate)} → ${formatDateIN(d.newDate)}`, reason: d.reason, requestedBy: d.changedBy.name, approvedBy: '', status: 'APPLIED' })),
      ...overrides.map((o) => ({ date: o.createdAt, kind: `Policy override · ${o.policyType.replace(/_/g, ' ').toLowerCase()}`, student: name(o.student), amount: null, detail: o.expiresAt ? `until ${formatDateIN(o.expiresAt)}` : 'no expiry', reason: o.reason, requestedBy: o.grantedBy.name, approvedBy: '', status: o.revokedAt ? 'REVOKED' : 'ACTIVE' })),
      ...reversals.map((p) => ({ date: p.bouncedAt ?? p.voidedAt, kind: p.status === 'BOUNCED' ? 'Cheque bounced' : 'Receipt voided', student: name(p.student), amount: p.amount, detail: p.receiptNo, reason: p.bounceReason ?? p.voidReason ?? '', requestedBy: uname(p.collectedById), approvedBy: '', status: p.status })),
      ...cancellations.map((c) => ({ date: c.cancelledAt, kind: 'Invoice cancelled', student: name(c.student), amount: c.total, detail: c.invoiceNo, reason: c.cancelReason ?? '', requestedBy: uname(c.cancelledById), approvedBy: '', status: 'CANCELLED' })),
    ].sort((a, b) => new Date(String(b.date)).getTime() - new Date(String(a.date)).getTime());
    return {
      title: 'Fee Adjustment Audit Report',
      subtitle: `${formatDateIN(q.from)} – ${formatDateIN(q.to)}`,
      filters: [['Entries', String(rows.length)]],
      columns: [
        { key: 'date', header: 'Date', kind: 'datetime' },
        { key: 'kind', header: 'Type', width: 28 },
        { key: 'student', header: 'Student / scope', width: 30 },
        { key: 'amount', header: 'Amount', kind: 'money' },
        { key: 'detail', header: 'Detail', width: 22 },
        { key: 'reason', header: 'Reason', width: 36 },
        { key: 'requestedBy', header: 'By', width: 18 },
        { key: 'approvedBy', header: 'Approved by', width: 18 },
        { key: 'status', header: 'Status' },
      ],
      rows,
    };
  }

  async invoiceRegister(schoolId: string, q: { termId?: string; status?: string; gradeId?: string }): Promise<ReportTable> {
    const year = await this.schools.currentYear(schoolId);
    const invoices = await this.prisma.invoice.findMany({
      where: {
        schoolId,
        ...(q.termId ? { termId: q.termId } : { academicYearId: year?.id }),
        ...(q.status ? { status: q.status as any } : {}),
        ...(q.gradeId ? { student: { enrollments: { some: { gradeId: q.gradeId, academicYearId: year?.id } } } } : {}),
      },
      include: { student: { include: { enrollments: { where: { academicYearId: year?.id }, include: { grade: true, section: true } } } } },
      orderBy: { invoiceNo: 'asc' },
      take: 10000,
    });
    return {
      title: 'Invoice Register',
      columns: [
        { key: 'invoiceNo', header: 'Invoice No.', width: 20 },
        { key: 'issueDate', header: 'Issued', kind: 'date' },
        { key: 'dueDate', header: 'Due', kind: 'date' },
        { key: 'student', header: 'Student', width: 24 },
        { key: 'className', header: 'Class' },
        { key: 'title', header: 'Title', width: 28 },
        { key: 'subtotal', header: 'Gross', kind: 'money' },
        { key: 'discount', header: 'Discount', kind: 'money' },
        { key: 'lateFee', header: 'Late fee', kind: 'money' },
        { key: 'total', header: 'Total', kind: 'money' },
        { key: 'paid', header: 'Paid', kind: 'money' },
        { key: 'balance', header: 'Balance', kind: 'money' },
        { key: 'status', header: 'Status' },
      ],
      rows: invoices.map((i) => {
        const e = i.student.enrollments[0];
        return {
          invoiceNo: i.invoiceNo,
          issueDate: toISODate(i.issueDate),
          dueDate: toISODate(i.dueDate),
          student: `${i.student.firstName} ${i.student.lastName}`,
          className: e ? `${e.grade.name}${e.section ? ` - ${e.section.name}` : ''}` : '',
          title: i.title,
          subtotal: i.subtotal,
          discount: i.discountTotal,
          lateFee: i.lateFee,
          total: i.total,
          paid: i.amountPaid,
          balance: i.balance,
          status: i.status,
        };
      }),
      totals: {
        invoiceNo: `${invoices.length} invoices`,
        subtotal: invoices.reduce((a, i) => a + i.subtotal, 0),
        discount: invoices.reduce((a, i) => a + i.discountTotal, 0),
        lateFee: invoices.reduce((a, i) => a + i.lateFee, 0),
        total: invoices.reduce((a, i) => a + i.total, 0),
        paid: invoices.reduce((a, i) => a + i.amountPaid, 0),
        balance: invoices.reduce((a, i) => a + i.balance, 0),
      },
    };
  }
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${y}`;
}
