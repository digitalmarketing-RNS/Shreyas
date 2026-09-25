import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { FeeStructureItem, FeeHead, Invoice, Term } from '@prisma/client';
import { addDays, applyDiscounts, formatINR, monthsInclusive, prorate, prorationFactor, todayIST, toISODate } from '@rnsis/shared';
import { PrismaService, Tx } from '../../prisma/prisma.service';
import { AuditService } from '../../core/audit/audit.service';
import { JobContext, JobsService } from '../../core/jobs/jobs.service';
import { SchoolService } from '../../core/settings/school.service';
import { FeeLedgerService, NewInvoiceLine } from './fee-ledger.service';
import { FeeNotifier } from './fee-notifier.service';

export const JOB_BULK_INVOICES = 'fees.bulk-generate-invoices';

interface BuildOptions {
  /** Bill one-time (admission) items too — first invoice at enrollment. */
  includeOneTime?: boolean;
  /** Join date for mid-session admissions (pro-ration). */
  joinDate?: string;
  isNewAdmission?: boolean;
}

type ItemWithHead = FeeStructureItem & { feeHead: FeeHead };

@Injectable()
export class InvoiceGenerationService implements OnModuleInit {
  private readonly logger = new Logger(InvoiceGenerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: FeeLedgerService,
    private readonly jobs: JobsService,
    private readonly schools: SchoolService,
    private readonly audit: AuditService,
    private readonly notifier: FeeNotifier,
  ) {}

  onModuleInit() {
    this.jobs.register(JOB_BULK_INVOICES, (payload, ctx) => this.runBulk(payload, ctx));
  }

  /**
   * Build the lines of a term invoice for one student: recurring per-term items, annual
   * items (first term or pinned term), one-time items on the enrollment invoice, opted-in
   * optional items, transport from the route mapping, pro-ration for mid-session joiners
   * and all approved discounts.
   */
  async buildTermLines(tx: Tx, studentId: string, term: Term, opts: BuildOptions = {}) {
    const enrollment = await tx.enrollment.findUnique({
      where: { studentId_academicYearId: { studentId, academicYearId: term.academicYearId } },
      include: { grade: true, student: true },
    });
    if (!enrollment) throw new BadRequestException('Student is not enrolled in this academic year');
    const structure = await tx.feeStructure.findUnique({
      where: { academicYearId_gradeId: { academicYearId: term.academicYearId, gradeId: enrollment.gradeId } },
      include: { items: { include: { feeHead: true }, orderBy: { sortOrder: 'asc' } } },
    });
    if (!structure || structure.status === 'ARCHIVED') throw new BadRequestException(`No active fee structure for ${enrollment.grade.name}`);
    const year = await tx.academicYear.findUniqueOrThrow({ where: { id: term.academicYearId } });
    const { settings } = await this.schools.get(year.schoolId);

    const optIns = new Set((await tx.studentOptionalFee.findMany({ where: { studentId, academicYearId: year.id } })).map((o) => o.feeHeadId));
    const isNew = opts.isNewAdmission ?? toISODate(enrollment.student.admissionDate) >= toISODate(year.startDate);
    const join = opts.joinDate ?? toISODate(enrollment.startDate);
    const pr = settings.fees.prorateMidSession ? prorationFactor(term.startDate, term.endDate, join) : { factor: 1, monthsInTerm: 0, monthsBilled: 0 };
    const annualFactor =
      settings.fees.prorateAnnualFees && join > toISODate(year.startDate) ? Math.min(1, monthsInclusive(join, year.endDate) / monthsInclusive(year.startDate, year.endDate)) : 1;

    const applies = (it: ItemWithHead) =>
      (it.applicability === 'ALL' || (it.applicability === 'NEW_ADMISSION' ? isNew : !isNew)) && (!it.isOptional || optIns.has(it.feeHeadId));

    const terms = await tx.term.findMany({ where: { academicYearId: year.id }, orderBy: { sequence: 'asc' } });

    const lines: NewInvoiceLine[] = [];
    let prorated = false;
    for (const it of structure.items as ItemWithHead[]) {
      if (!applies(it)) continue;
      if (it.frequency === 'ONE_TIME') {
        if (opts.includeOneTime) lines.push({ feeHeadId: it.feeHeadId, description: it.feeHead.name, amount: it.amount });
      } else if (it.frequency === 'ANNUAL') {
        // Annual items bill on their pinned term (default: first term). The enrollment
        // invoice of a mid-year joiner also picks up annual items of terms already past.
        const pinnedIdx = it.termId ? terms.findIndex((t) => t.id === it.termId) : 0;
        const thisIdx = terms.findIndex((t) => t.id === term.id);
        if (opts.includeOneTime ? pinnedIdx <= thisIdx : pinnedIdx === thisIdx) {
          const amt = prorate(it.amount, annualFactor);
          if (amt < it.amount) prorated = true;
          lines.push({ feeHeadId: it.feeHeadId, description: `${it.feeHead.name} (annual)`, amount: amt });
        }
      } else {
        const amt = prorate(it.amount, pr.factor);
        if (amt < it.amount) prorated = true;
        lines.push({ feeHeadId: it.feeHeadId, description: `${it.feeHead.name} — ${term.name}`, amount: amt });
      }
    }

    // Transport: fee comes from the student's route / stop mapping.
    const transport = await tx.studentTransport.findFirst({
      where: { studentId, academicYearId: year.id, active: true },
      include: { route: true, stop: true },
    });
    if (transport) {
      const head =
        (await tx.feeHead.findFirst({ where: { schoolId: year.schoolId, category: 'TRANSPORT', active: true } })) ??
        (await tx.feeHead.create({ data: { schoolId: year.schoolId, name: 'Transportation', code: 'TRANSPORT', category: 'TRANSPORT', priority: 40 } }));
      const fee = transport.stop?.termFee ?? transport.route.termFee;
      const tfactor = toISODate(transport.startDate) > toISODate(term.startDate) ? prorationFactor(term.startDate, term.endDate, transport.startDate).factor : 1;
      const amt = prorate(fee, Math.min(tfactor, pr.factor));
      if (amt > 0) lines.push({ feeHeadId: head.id, description: `Transport — ${transport.route.name}${transport.stop ? ` (${transport.stop.name})` : ''} — ${term.name}`, amount: amt });
    }

    // Approved discounts for the year.
    const discounts = await tx.studentDiscount.findMany({ where: { studentId, academicYearId: year.id, status: 'APPROVED' } });
    const d = applyDiscounts(
      lines.map((l) => ({ feeHeadId: l.feeHeadId, amount: l.amount })),
      discounts.map((x) => ({ id: x.id, mode: x.mode, value: x.value, feeHeadIds: x.feeHeadIds })),
    );
    lines.forEach((l, i) => {
      l.discount = d[i].discount;
      l.discountSources = d[i].sources;
    });

    return {
      lines,
      enrollment,
      year,
      prorated,
      prorationNote: prorated ? `Pro-rated from ${join}: ${pr.monthsBilled} of ${pr.monthsInTerm} months in ${term.name}` : null,
    };
  }

  /** Create the term invoice for one student (idempotent via dedupeKey). */
  async generateForStudent(tx: Tx, studentId: string, termId: string, opts: BuildOptions & { createdById?: string | null; jobId?: string | null; title?: string } = {}): Promise<Invoice | null> {
    const dedupeKey = `TERM:${studentId}:${termId}`;
    const existing = await tx.invoice.findUnique({ where: { dedupeKey } });
    if (existing) return null;
    const term = await tx.term.findUniqueOrThrow({ where: { id: termId } });
    const built = await this.buildTermLines(tx, studentId, term, opts);
    if (!built.lines.some((l) => l.amount > 0)) return null;
    const today = todayIST();
    // New admissions after the due date get a week to pay.
    let due = toISODate(term.dueDate);
    if (opts.joinDate && due < addDays(today, 7)) due = addDays(today, 7);
    const title = opts.title ?? `${opts.includeOneTime ? 'Admission & ' : ''}${term.name} Fees ${built.year.name}`;
    return this.ledger.createInvoice(tx, {
      schoolId: built.year.schoolId,
      studentId,
      academicYearId: built.year.id,
      termId,
      type: 'TERM',
      title,
      dueDate: due,
      lines: built.lines,
      dedupeKey,
      isProrated: built.prorated,
      prorationNote: built.prorationNote,
      createdById: opts.createdById,
      jobId: opts.jobId,
    });
  }

  /** The term a student joining on `date` should be billed for first. */
  async billingTermFor(academicYearId: string, date: string) {
    const terms = await this.prisma.term.findMany({ where: { academicYearId }, orderBy: { sequence: 'asc' } });
    return terms.find((t) => toISODate(t.endDate) >= date) ?? terms[terms.length - 1];
  }

  async startBulk(schoolId: string, dto: { termId: string; gradeIds?: string[]; sectionIds?: string[]; studentIds?: string[]; notify?: boolean }, actorId: string | null) {
    const term = await this.prisma.term.findFirst({ where: { id: dto.termId, schoolId }, include: { academicYear: true } });
    if (!term) throw new NotFoundException('Term not found');
    const scope = dto.studentIds?.length ? `${dto.studentIds.length} students` : dto.sectionIds?.length ? `${dto.sectionIds.length} sections` : dto.gradeIds?.length ? `${dto.gradeIds.length} grades` : 'whole school';
    const job = await this.jobs.enqueue(JOB_BULK_INVOICES, { ...dto }, { schoolId, createdById: actorId, title: `Generate ${term.name} ${term.academicYear.name} invoices (${scope})` });
    await this.audit.log({ schoolId, action: 'invoice.bulk_generate_started', entityType: 'Term', entityId: term.id, summary: `Bulk invoice generation queued for ${term.name} (${scope})`, meta: { jobId: job.id, ...dto } });
    return this.jobs.toDto(job);
  }

  /** Background job: generate invoices in batches with live progress (handles 4,000+ students). */
  private async runBulk(payload: { termId: string; gradeIds?: string[]; sectionIds?: string[]; studentIds?: string[]; notify?: boolean }, ctx: JobContext) {
    const term = await this.prisma.term.findUniqueOrThrow({ where: { id: payload.termId } });
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        academicYearId: term.academicYearId,
        status: 'ACTIVE',
        student: { status: 'ACTIVE' },
        ...(payload.gradeIds?.length ? { gradeId: { in: payload.gradeIds } } : {}),
        ...(payload.sectionIds?.length ? { sectionId: { in: payload.sectionIds } } : {}),
        ...(payload.studentIds?.length ? { studentId: { in: payload.studentIds } } : {}),
      },
      select: { studentId: true },
      orderBy: { studentId: 'asc' },
    });
    await ctx.setTotal(enrollments.length);
    let created = 0;
    let skipped = 0;
    let failed = 0;
    let billed = 0;
    const errors: { studentId: string; error: string }[] = [];
    const createdIds: string[] = [];
    const BATCH = 20;
    for (let i = 0; i < enrollments.length; i += BATCH) {
      if (await ctx.isCancelled()) break;
      for (const e of enrollments.slice(i, i + BATCH)) {
        try {
          const inv = await this.prisma.tx((tx) => this.generateForStudent(tx, e.studentId, term.id, { createdById: ctx.job.createdById, jobId: ctx.job.id }));
          if (inv) {
            created++;
            billed += inv.total;
            createdIds.push(inv.id);
          } else skipped++;
        } catch (err: any) {
          failed++;
          if (errors.length < 200) errors.push({ studentId: e.studentId, error: err.message });
        }
      }
      await ctx.progress(Math.min(enrollments.length, i + BATCH), { failed });
    }
    const wholeSchool = !payload.gradeIds?.length && !payload.sectionIds?.length && !payload.studentIds?.length;
    if (wholeSchool) await this.prisma.term.update({ where: { id: term.id }, data: { invoicesGeneratedAt: new Date() } });
    if (payload.notify && createdIds.length) {
      for (const id of createdIds) await this.notifier.invoiceIssued(id).catch((e) => this.logger.warn(`Invoice notify failed: ${e.message}`));
    }
    await this.audit.log({
      schoolId: ctx.job.schoolId,
      action: 'invoice.bulk_generate_completed',
      entityType: 'Term',
      entityId: term.id,
      summary: `${term.name}: ${created} invoices created (${formatINR(billed)}), ${skipped} already existed, ${failed} failed`,
      meta: { jobId: ctx.job.id },
    });
    return { created, skipped, failed, billed, errors };
  }

  /** Scheduler entry point: open terms whose invoice date has arrived. */
  async autoGenerateDueTerms() {
    const today = todayIST();
    const terms = await this.prisma.term.findMany({
      where: { autoGenerateInvoices: true, invoicesGeneratedAt: null, invoiceDate: { lte: new Date(`${today}T00:00:00Z`) }, academicYear: { isCurrent: true } },
      include: { academicYear: true },
    });
    for (const t of terms) {
      const running = await this.prisma.backgroundJob.count({ where: { type: JOB_BULK_INVOICES, status: { in: ['QUEUED', 'RUNNING'] }, payload: { path: ['termId'], equals: t.id } } });
      if (running) continue;
      this.logger.log(`Auto-generating invoices for ${t.name} ${t.academicYear.name}`);
      await this.startBulk(t.schoolId, { termId: t.id, notify: true }, null);
    }
    return terms.length;
  }
}
