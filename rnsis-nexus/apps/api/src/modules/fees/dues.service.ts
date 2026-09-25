import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { FeePolicyType, NotificationChannel, Prisma } from '@prisma/client';
import { AGING_BUCKETS, agingBucket, dateOnly, daysBetween, DefaulterRow, formatDateIN, formatINR, policyTriggered, todayIST, toISODate, addDays } from '@rnsis/shared';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserData } from '../../common/context/auth-user';
import { AuditService } from '../../core/audit/audit.service';
import { JobContext, JobsService } from '../../core/jobs/jobs.service';
import { SchoolService } from '../../core/settings/school.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FeeDocumentsService } from './fee-documents.service';

export const JOB_BULK_REMINDERS = 'fees.bulk-reminders';

export interface DefaulterFilters {
  gradeIds?: string[];
  sectionIds?: string[];
  minAmount?: number;
  minDays?: number;
  maxDays?: number;
  bucket?: string;
  q?: string;
  sort?: 'amount' | 'days' | 'name';
}

const POLICY_LABEL: Record<FeePolicyType, string> = {
  BLOCK_REPORT_CARD: 'Report card blocked',
  BLOCK_ADMIT_CARD: 'Exam admit card blocked',
  RESTRICT_PARENT_PORTAL: 'Parent portal restricted',
};

@Injectable()
export class DuesService implements OnModuleInit {
  private readonly logger = new Logger(DuesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: JobsService,
    private readonly notifications: NotificationsService,
    private readonly docs: FeeDocumentsService,
    private readonly audit: AuditService,
    private readonly schools: SchoolService,
  ) {}

  onModuleInit() {
    this.jobs.register(JOB_BULK_REMINDERS, (payload, ctx) => this.runBulkReminders(payload, ctx));
  }

  /* ------------------------------ Defaulters ------------------------------ */

  private filterSql(schoolId: string, yearId: string | null, f: DefaulterFilters, today: string) {
    const conds: Prisma.Sql[] = [Prisma.sql`d.overdue > 0`];
    if (f.gradeIds?.length) conds.push(Prisma.sql`e."gradeId" IN (${Prisma.join(f.gradeIds)})`);
    if (f.sectionIds?.length) conds.push(Prisma.sql`e."sectionId" IN (${Prisma.join(f.sectionIds)})`);
    if (f.minAmount) conds.push(Prisma.sql`d.overdue >= ${f.minAmount}`);
    if (f.minDays) conds.push(Prisma.sql`(${today}::date - d.oldest_due) >= ${f.minDays}`);
    if (f.maxDays) conds.push(Prisma.sql`(${today}::date - d.oldest_due) <= ${f.maxDays}`);
    if (f.bucket) {
      const [lo, hi] = f.bucket === '90+' ? [91, 100000] : f.bucket.split('-').map(Number);
      conds.push(Prisma.sql`(${today}::date - d.oldest_due) BETWEEN ${f.bucket === '0-30' ? 1 : lo} AND ${hi}`);
    }
    if (f.q) {
      const like = `%${f.q.toLowerCase()}%`;
      conds.push(Prisma.sql`(lower(s."firstName" || ' ' || s."lastName") LIKE ${like} OR lower(s."admissionNo") LIKE ${like})`);
    }
    const cte = Prisma.sql`
      WITH d AS (
        SELECT i."studentId",
               SUM(i."balance") FILTER (WHERE i."dueDate" < ${today}::date)::int AS overdue,
               SUM(i."balance")::int AS total_balance,
               COUNT(*) FILTER (WHERE i."dueDate" < ${today}::date)::int AS overdue_count,
               MIN(i."dueDate") FILTER (WHERE i."dueDate" < ${today}::date) AS oldest_due
          FROM "Invoice" i
         WHERE i."schoolId" = ${schoolId} AND i."status" IN ('PENDING','PARTIALLY_PAID','OVERDUE') AND i."balance" > 0
         GROUP BY i."studentId")`;
    const from = Prisma.sql`
        FROM d
        JOIN "Student" s ON s."id" = d."studentId"
        LEFT JOIN "Enrollment" e ON e."studentId" = s."id" AND e."academicYearId" = ${yearId ?? ''}
        LEFT JOIN "Grade" g ON g."id" = e."gradeId"
        LEFT JOIN "Section" sec ON sec."id" = e."sectionId"
       WHERE ${Prisma.join(conds, ' AND ')}`;
    return { cte, from };
  }

  async defaulters(schoolId: string, f: DefaulterFilters, page = 1, pageSize = 50) {
    const today = todayIST();
    const year = await this.schools.currentYear(schoolId);
    const { cte, from } = this.filterSql(schoolId, year?.id ?? null, f, today);
    const order =
      f.sort === 'days' ? Prisma.sql`d.oldest_due ASC, d.overdue DESC` : f.sort === 'name' ? Prisma.sql`s."firstName" ASC, s."lastName" ASC` : Prisma.sql`d.overdue DESC, d.oldest_due ASC`;
    const [rows, agg] = await Promise.all([
      this.prisma.$queryRaw<any[]>`${cte}
        SELECT s."id" AS "studentId", s."admissionNo", s."firstName", s."lastName", g."name" AS "gradeName", sec."name" AS "sectionName",
               d.overdue, d.total_balance AS "totalBalance", d.overdue_count AS "overdueCount", d.oldest_due AS "oldestDue"
        ${from} ORDER BY ${order} LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      this.prisma.$queryRaw<any[]>`${cte}
        SELECT COUNT(*)::int AS count, COALESCE(SUM(d.overdue),0)::bigint AS overdue, COALESCE(SUM(d.total_balance),0)::bigint AS balance ${from}`,
    ]);
    const ids = rows.map((r) => r.studentId);
    const [guardians, reminders, commitments] = await Promise.all([
      this.prisma.studentGuardian.findMany({ where: { studentId: { in: ids } }, include: { guardian: true }, orderBy: { isPrimary: 'desc' } }),
      this.prisma.reminderLog.groupBy({ by: ['studentId'], where: { studentId: { in: ids } }, _max: { sentAt: true } }),
      this.prisma.paymentCommitment.findMany({ where: { studentId: { in: ids }, status: { in: ['PENDING', 'KEPT', 'BROKEN', 'PARTIALLY_KEPT'] } }, orderBy: { createdAt: 'desc' } }),
    ]);
    const items: DefaulterRow[] = rows.map((r) => {
      const g = guardians.find((x) => x.studentId === r.studentId)?.guardian;
      const c = commitments.find((x) => x.studentId === r.studentId);
      const days = daysBetween(r.oldestDue, today);
      return {
        studentId: r.studentId,
        admissionNo: r.admissionNo,
        name: `${r.firstName} ${r.lastName}`,
        gradeName: r.gradeName,
        sectionName: r.sectionName,
        className: r.gradeName ? `${r.gradeName}${r.sectionName ? ` - ${r.sectionName}` : ''}` : null,
        primaryGuardian: g?.name ?? null,
        phone: g?.phone ?? null,
        overdueAmount: Number(r.overdue),
        totalBalance: Number(r.totalBalance),
        overdueInvoices: Number(r.overdueCount),
        oldestDueDate: toISODate(r.oldestDue),
        daysOverdue: days,
        bucket: agingBucket(days),
        lastReminderAt: reminders.find((x) => x.studentId === r.studentId)?._max.sentAt?.toISOString() ?? null,
        commitment: c ? { amount: c.amount, promisedDate: toISODate(c.promisedDate), status: c.status } : null,
      };
    });
    return { items, total: Number(agg[0]?.count ?? 0), totalOverdue: Number(agg[0]?.overdue ?? 0), totalBalance: Number(agg[0]?.balance ?? 0), page, pageSize };
  }

  /** All matching student ids (for "select all" bulk reminders). */
  async defaulterIds(schoolId: string, f: DefaulterFilters): Promise<string[]> {
    const all: string[] = [];
    for (let page = 1; page < 100; page++) {
      const res = await this.defaulters(schoolId, f, page, 200);
      all.push(...res.items.map((i) => i.studentId));
      if (res.items.length < 200) break;
    }
    return all;
  }

  /** Invoice-level aging buckets + student counts by oldest due. */
  async aging(schoolId: string, f: { gradeIds?: string[] } = {}) {
    const today = todayIST();
    const year = await this.schools.currentYear(schoolId);
    const gradeFilter = f.gradeIds?.length ? Prisma.sql`AND e."gradeId" IN (${Prisma.join(f.gradeIds)})` : Prisma.empty;
    const rows = await this.prisma.$queryRaw<{ bucket: string; amount: bigint; invoices: number; students: number }[]>`
      SELECT CASE WHEN (${today}::date - i."dueDate") <= 30 THEN '0-30'
                  WHEN (${today}::date - i."dueDate") <= 60 THEN '31-60'
                  WHEN (${today}::date - i."dueDate") <= 90 THEN '61-90' ELSE '90+' END AS bucket,
             SUM(i."balance")::bigint AS amount, COUNT(*)::int AS invoices, COUNT(DISTINCT i."studentId")::int AS students
        FROM "Invoice" i
        LEFT JOIN "Enrollment" e ON e."studentId" = i."studentId" AND e."academicYearId" = ${year?.id ?? ''}
       WHERE i."schoolId" = ${schoolId} AND i."status" IN ('PENDING','PARTIALLY_PAID','OVERDUE') AND i."balance" > 0 AND i."dueDate" < ${today}::date ${gradeFilter}
       GROUP BY 1`;
    return AGING_BUCKETS.map((b) => {
      const r = rows.find((x) => x.bucket === b);
      return { bucket: b, amount: Number(r?.amount ?? 0), invoices: r?.invoices ?? 0, students: r?.students ?? 0 };
    });
  }

  /* ------------------------------ Reminders ------------------------------ */

  async startBulkReminders(actor: CurrentUserData, dto: { studentIds?: string[]; filters?: DefaulterFilters; channels: NotificationChannel[]; message?: string }) {
    const ids = dto.studentIds?.length ? dto.studentIds : await this.defaulterIds(actor.schoolId, dto.filters ?? {});
    if (!ids.length) throw new BadRequestException('No students selected');
    const job = await this.jobs.enqueue(
      JOB_BULK_REMINDERS,
      { studentIds: ids, channels: dto.channels, message: dto.message ?? null },
      { schoolId: actor.schoolId, createdById: actor.id, title: `Fee reminders to ${ids.length} families (${dto.channels.join(' + ')})` },
    );
    await this.audit.log({ action: 'fees.bulk_reminder_started', entityType: 'BackgroundJob', entityId: job.id, summary: `Bulk fee reminder to ${ids.length} families via ${dto.channels.join(', ')}` });
    return this.jobs.toDto(job);
  }

  /** Send a reminder for one student's dues; returns messages queued. */
  async remindStudent(studentId: string, channels: NotificationChannel[], kind: 'MANUAL' | 'AUTO', opts: { ruleId?: string; invoiceId?: string; templateKey?: string; sentById?: string | null } = {}) {
    const today = todayIST();
    const invoices = await this.prisma.invoice.findMany({
      where: { studentId, status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] }, balance: { gt: 0 }, ...(opts.invoiceId ? { id: opts.invoiceId } : {}) },
      orderBy: { dueDate: 'asc' },
    });
    if (!invoices.length) return 0;
    const due = invoices.reduce((a, i) => a + i.balance, 0);
    const oldest = invoices[0];
    const days = daysBetween(oldest.dueDate, today);
    const templateKey = opts.templateKey ?? (days > 0 ? 'FEE_REMINDER_OVERDUE' : days === 0 ? 'FEE_REMINDER_DUE' : 'FEE_REMINDER_BEFORE');
    const lateFee = invoices.reduce((a, i) => a + i.lateFee, 0);
    const n = await this.notifications.notifyGuardians(studentId, {
      templateKey,
      channels,
      related: { type: 'Invoice', id: oldest.id },
      data: {
        amount_due: formatINR(due),
        due_date: formatDateIN(oldest.dueDate),
        days: Math.abs(days),
        late_fee: lateFee ? `A late fee of ${formatINR(lateFee)} has been applied.` : '',
        pay_url: await this.docs.payLink(studentId, opts.invoiceId),
      },
    });
    const school = invoices[0].schoolId;
    await this.prisma.reminderLog.create({
      data: { schoolId: school, studentId, ruleId: opts.ruleId ?? null, invoiceId: opts.ruleId ? oldest.id : opts.invoiceId ?? null, kind, channels, amountDue: due, sentById: opts.sentById ?? null },
    });
    return n;
  }

  private async runBulkReminders(payload: { studentIds: string[]; channels: NotificationChannel[] }, ctx: JobContext) {
    await ctx.setTotal(payload.studentIds.length);
    let messages = 0;
    let families = 0;
    let failed = 0;
    for (let i = 0; i < payload.studentIds.length; i++) {
      try {
        const n = await this.remindStudent(payload.studentIds[i], payload.channels, 'MANUAL', { sentById: ctx.job.createdById });
        messages += n;
        if (n) families++;
      } catch (e: any) {
        failed++;
        this.logger.warn(`Reminder failed for ${payload.studentIds[i]}: ${e.message}`);
      }
      if (i % 10 === 0 || i === payload.studentIds.length - 1) await ctx.progress(i + 1, { failed });
    }
    return { families, messages, failed };
  }

  /** Scheduled reminders from ReminderRule (e.g. −7, 0, +3, +7, +15 days). Idempotent per rule+invoice. */
  async runScheduledReminders() {
    const today = todayIST();
    const rules = await this.prisma.reminderRule.findMany({ where: { enabled: true } });
    let sent = 0;
    for (const rule of rules) {
      const target = addDays(today, -rule.offsetDays); // invoices whose due date is `offset` days from today
      const invoices = await this.prisma.invoice.findMany({
        where: { schoolId: rule.schoolId, dueDate: dateOnly(target), status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] }, balance: { gt: rule.minBalance } },
        select: { id: true, studentId: true },
      });
      for (const inv of invoices) {
        const done = await this.prisma.reminderLog.findUnique({ where: { ruleId_invoiceId: { ruleId: rule.id, invoiceId: inv.id } } });
        if (done) continue;
        try {
          sent += await this.remindStudent(inv.studentId, rule.channels, 'AUTO', { ruleId: rule.id, invoiceId: inv.id, templateKey: rule.templateKey });
        } catch (e: any) {
          this.logger.warn(`Scheduled reminder failed for invoice ${inv.id}: ${e.message}`);
        }
      }
    }
    return sent;
  }

  reminderRules(schoolId: string) {
    return this.prisma.reminderRule.findMany({ where: { schoolId }, orderBy: { offsetDays: 'asc' } });
  }

  async saveReminderRules(schoolId: string, rules: { id?: string; name: string; offsetDays: number; channels: NotificationChannel[]; templateKey: string; enabled: boolean; minBalance?: number }[]) {
    const before = await this.reminderRules(schoolId);
    const offsets = rules.map((r) => r.offsetDays);
    if (new Set(offsets).size !== offsets.length) throw new BadRequestException('Two reminders cannot use the same day offset');
    await this.prisma.$transaction(async (tx) => {
      const keep = rules.filter((r) => r.id).map((r) => r.id!);
      await tx.reminderRule.deleteMany({ where: { schoolId, id: { notIn: keep } } });
      // temporarily move offsets to avoid unique collisions while reordering
      for (const r of rules.filter((x) => x.id)) await tx.reminderRule.update({ where: { id: r.id }, data: { offsetDays: 10000 + Math.abs(r.offsetDays) + (r.offsetDays < 0 ? 5000 : 0) } });
      for (const r of rules) {
        const data = { name: r.name, offsetDays: r.offsetDays, channels: r.channels, templateKey: r.templateKey, enabled: r.enabled, minBalance: r.minBalance ?? 0 };
        if (r.id) await tx.reminderRule.update({ where: { id: r.id }, data });
        else await tx.reminderRule.create({ data: { schoolId, ...data } });
      }
    });
    const after = await this.reminderRules(schoolId);
    await this.audit.log({ schoolId, action: 'fees.reminder_schedule_updated', entityType: 'ReminderRule', summary: `Reminder schedule updated (${after.filter((r) => r.enabled).length} active)`, before, after });
    return after;
  }

  /* ------------------------------ Policies ------------------------------ */

  async policies(schoolId: string) {
    const rows = await this.prisma.feePolicy.findMany({ where: { schoolId } });
    return (Object.keys(POLICY_LABEL) as FeePolicyType[]).map((type) => rows.find((r) => r.type === type) ?? { id: null, schoolId, type, enabled: false, thresholdAmount: null, thresholdDays: null, message: null, updatedAt: null });
  }

  async savePolicy(schoolId: string, type: FeePolicyType, dto: { enabled: boolean; thresholdAmount?: number | null; thresholdDays?: number | null; message?: string | null }) {
    const before = await this.prisma.feePolicy.findUnique({ where: { schoolId_type: { schoolId, type } } });
    const row = await this.prisma.feePolicy.upsert({
      where: { schoolId_type: { schoolId, type } },
      create: { schoolId, type, enabled: dto.enabled, thresholdAmount: dto.thresholdAmount ?? null, thresholdDays: dto.thresholdDays ?? null, message: dto.message ?? null },
      update: { enabled: dto.enabled, thresholdAmount: dto.thresholdAmount ?? null, thresholdDays: dto.thresholdDays ?? null, message: dto.message ?? null },
    });
    await this.audit.log({ schoolId, action: 'fees.policy_updated', entityType: 'FeePolicy', entityId: row.id, summary: `Dues policy "${POLICY_LABEL[type]}" ${row.enabled ? 'enabled' : 'disabled'}`, before, after: row });
    return row;
  }

  /** Is this policy blocking the student right now? (overrides respected) */
  async evaluate(studentId: string, type: FeePolicyType) {
    const student = await this.prisma.student.findUniqueOrThrow({ where: { id: studentId }, select: { schoolId: true } });
    const policy = await this.prisma.feePolicy.findUnique({ where: { schoolId_type: { schoolId: student.schoolId, type } } });
    const today = todayIST();
    const overdue = await this.prisma.invoice.findMany({
      where: { studentId, status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] }, balance: { gt: 0 }, dueDate: { lt: dateOnly(today) } },
      select: { balance: true, dueDate: true },
      orderBy: { dueDate: 'asc' },
    });
    const overdueAmount = overdue.reduce((a, i) => a + i.balance, 0);
    const maxDays = overdue.length ? daysBetween(overdue[0].dueDate, today) : 0;
    const triggered = policy ? policyTriggered(policy, overdueAmount, maxDays) : false;
    const override = triggered
      ? await this.prisma.policyOverride.findFirst({
          where: { studentId, policyType: type, revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
          include: { grantedBy: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        })
      : null;
    return {
      type,
      label: POLICY_LABEL[type],
      blocked: triggered && !override,
      triggered,
      overdueAmount,
      daysOverdue: maxDays,
      message: triggered && !override ? policy?.message ?? `${POLICY_LABEL[type]} due to pending fees of ${formatINR(overdueAmount)}. Please clear the dues or contact the accounts office.` : null,
      override: override ? { id: override.id, reason: override.reason, by: override.grantedBy.name, expiresAt: override.expiresAt } : null,
    };
  }

  async evaluateAll(studentId: string) {
    return Promise.all((Object.keys(POLICY_LABEL) as FeePolicyType[]).map((t) => this.evaluate(studentId, t)));
  }

  async grantOverride(actor: CurrentUserData, dto: { studentId: string; policyType: FeePolicyType; reason: string; expiresAt?: string }) {
    const s = await this.prisma.student.findFirst({ where: { id: dto.studentId, schoolId: actor.schoolId } });
    if (!s) throw new NotFoundException('Student not found');
    const o = await this.prisma.policyOverride.create({
      data: { schoolId: actor.schoolId, studentId: s.id, policyType: dto.policyType, reason: dto.reason, grantedById: actor.id, expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null },
    });
    await this.audit.log({ action: 'fees.policy_override_granted', entityType: 'PolicyOverride', entityId: o.id, summary: `${POLICY_LABEL[dto.policyType]} overridden for ${s.firstName} ${s.lastName} (${s.admissionNo}): ${dto.reason}`, after: o });
    return o;
  }

  async revokeOverride(actor: CurrentUserData, id: string) {
    const o = await this.prisma.policyOverride.findFirst({ where: { id, schoolId: actor.schoolId } });
    if (!o) throw new NotFoundException('Override not found');
    await this.prisma.policyOverride.update({ where: { id }, data: { revokedAt: new Date() } });
    await this.audit.log({ action: 'fees.policy_override_revoked', entityType: 'PolicyOverride', entityId: id, summary: `Override for ${POLICY_LABEL[o.policyType]} revoked` });
  }

  /** Students currently blocked by a policy (for the principal's override screen). */
  async blockedStudents(schoolId: string, type: FeePolicyType) {
    const policy = await this.prisma.feePolicy.findUnique({ where: { schoolId_type: { schoolId, type } } });
    if (!policy?.enabled) return [];
    const res = await this.defaulters(schoolId, { minAmount: policy.thresholdAmount ?? undefined }, 1, 500);
    const rows = res.items.filter((r) => policyTriggered(policy, r.overdueAmount, r.daysOverdue));
    const overrides = await this.prisma.policyOverride.findMany({
      where: { studentId: { in: rows.map((r) => r.studentId) }, policyType: type, revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      include: { grantedBy: { select: { name: true } } },
    });
    return rows.map((r) => {
      const o = overrides.find((x) => x.studentId === r.studentId);
      return { ...r, override: o ? { id: o.id, reason: o.reason, by: o.grantedBy.name, at: o.createdAt, expiresAt: o.expiresAt } : null };
    });
  }

  /* ------------------------------ Commitments (promise-to-pay) ------------------------------ */

  async createCommitment(actor: CurrentUserData, dto: { studentId: string; amount: number; promisedDate: string; notes?: string; contactPerson?: string }) {
    const s = await this.prisma.student.findFirst({ where: { id: dto.studentId, schoolId: actor.schoolId } });
    if (!s) throw new NotFoundException('Student not found');
    if (dto.promisedDate < todayIST()) throw new BadRequestException('Promised date cannot be in the past');
    await this.prisma.paymentCommitment.updateMany({ where: { studentId: s.id, status: 'PENDING' }, data: { status: 'CANCELLED' } });
    const c = await this.prisma.paymentCommitment.create({
      data: { schoolId: actor.schoolId, studentId: s.id, amount: dto.amount, promisedDate: dateOnly(dto.promisedDate), notes: dto.notes, contactPerson: dto.contactPerson, recordedById: actor.id },
    });
    await this.audit.log({ action: 'fees.commitment_recorded', entityType: 'PaymentCommitment', entityId: c.id, summary: `Promise to pay ${formatINR(dto.amount)} by ${formatDateIN(dto.promisedDate)} recorded for ${s.firstName} ${s.lastName}` });
    return c;
  }

  async cancelCommitment(actor: CurrentUserData, id: string) {
    const c = await this.prisma.paymentCommitment.findFirst({ where: { id, schoolId: actor.schoolId } });
    if (!c) throw new NotFoundException('Commitment not found');
    return this.prisma.paymentCommitment.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  /** KEPT / PARTIALLY_KEPT / BROKEN once the promised date passes (or early when fully paid). */
  async evaluateCommitments(schoolId?: string) {
    const today = todayIST();
    const pending = await this.prisma.paymentCommitment.findMany({ where: { status: 'PENDING', ...(schoolId ? { schoolId } : {}) } });
    let changed = 0;
    for (const c of pending) {
      const end = new Date(`${toISODate(c.promisedDate)}T23:59:59.999+05:30`);
      const agg = await this.prisma.payment.aggregate({ where: { studentId: c.studentId, status: { in: ['SUCCESS', 'PENDING_CLEARANCE'] }, paidAt: { gte: c.createdAt, lte: end } }, _sum: { amount: true } });
      const received = agg._sum.amount ?? 0;
      let status: 'PENDING' | 'KEPT' | 'PARTIALLY_KEPT' | 'BROKEN' = 'PENDING';
      if (received >= c.amount) status = 'KEPT';
      else if (toISODate(c.promisedDate) < today) status = received > 0 ? 'PARTIALLY_KEPT' : 'BROKEN';
      if (status !== 'PENDING' || received !== c.amountReceived) {
        await this.prisma.paymentCommitment.update({ where: { id: c.id }, data: { status, amountReceived: received, evaluatedAt: status !== 'PENDING' ? new Date() : null } });
        changed++;
      }
    }
    return changed;
  }

  async commitments(schoolId: string, status?: string) {
    await this.evaluateCommitments(schoolId);
    const rows = await this.prisma.paymentCommitment.findMany({
      where: { schoolId, ...(status ? { status: status as any } : {}) },
      include: { student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } }, recordedBy: { select: { name: true } } },
      orderBy: { promisedDate: 'asc' },
      take: 500,
    });
    const summary = await this.prisma.paymentCommitment.groupBy({ by: ['status'], where: { schoolId }, _count: true, _sum: { amount: true, amountReceived: true } });
    return { items: rows, summary: summary.map((s) => ({ status: s.status, count: s._count, amount: s._sum.amount ?? 0, received: s._sum.amountReceived ?? 0 })) };
  }
}
