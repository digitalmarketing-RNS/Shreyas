import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { dateOnly, formatDateIN, formatINR, todayIST, toISODate } from '@rnsis/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../core/audit/audit.service';
import { JobContext, JobsService } from '../../core/jobs/jobs.service';
import { FeeLedgerService } from './fee-ledger.service';
import { FeeNotifier } from './fee-notifier.service';

const JOB_NOTIFY_DUE_DATE = 'fees.notify-due-date-change';

/**
 * Editable due dates. Changing a term's due date (e.g. 15 Oct → 30 Oct) re-dates every
 * unpaid invoice of that term, recalculates late fees (they can go down to zero), fixes
 * statuses, logs a DueDateChange row + audit entry, and optionally notifies parents.
 */
@Injectable()
export class DueDatesService implements OnModuleInit {
  private readonly logger = new Logger(DueDatesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: FeeLedgerService,
    private readonly audit: AuditService,
    private readonly jobs: JobsService,
    private readonly notifier: FeeNotifier,
  ) {}

  onModuleInit() {
    this.jobs.register(JOB_NOTIFY_DUE_DATE, (payload, ctx) => this.runNotify(payload, ctx));
  }

  async changeTermDueDate(schoolId: string, termId: string, dto: { newDate: string; reason: string; notifyParents: boolean }, actorId: string) {
    const term = await this.prisma.term.findFirst({ where: { id: termId, schoolId }, include: { academicYear: true } });
    if (!term) throw new NotFoundException('Term not found');
    const oldDate = toISODate(term.dueDate);
    if (oldDate === dto.newDate) throw new BadRequestException('The new due date is the same as the current one');
    if (dto.newDate < toISODate(term.academicYear.startDate) || dto.newDate > toISODate(term.academicYear.endDate)) throw new BadRequestException('Due date must fall within the academic year');
    const today = todayIST();
    const newDate = dateOnly(dto.newDate);

    const result = await this.prisma.tx(
      async (tx) => {
        await tx.term.update({ where: { id: termId }, data: { dueDate: newDate } });
        // Re-date every unpaid invoice of the term in one statement and fix statuses.
        const affected = await tx.$queryRaw<{ id: string }[]>`
          UPDATE "Invoice" SET "dueDate" = ${newDate}, "updatedAt" = now(),
            "status" = (CASE WHEN "balance" <= 0 THEN 'PAID'
                             WHEN ${dto.newDate}::date < ${today}::date THEN 'OVERDUE'
                             WHEN "amountPaid" > 0 THEN 'PARTIALLY_PAID'
                             ELSE 'PENDING' END)::"InvoiceStatus"
          WHERE "termId" = ${termId} AND "status" IN ('PENDING','PARTIALLY_PAID','OVERDUE')
          RETURNING "id"`;
        // Late fees: only invoices that already carry one, or that are now past due under an enabled rule.
        const rule = await this.ledger.lateFeeRule(tx, term.academicYearId);
        const needLateFee = await tx.invoice.findMany({
          where: {
            id: { in: affected.map((a) => a.id) },
            lateFeeFrozen: false,
            OR: [{ lateFee: { gt: 0 } }, ...(rule.enabled && dto.newDate < today ? [{ dueDate: { lt: dateOnly(today) } }] : [])],
          },
          select: { id: true },
        });
        let lateFeeDelta = 0;
        for (const inv of needLateFee) lateFeeDelta += await this.ledger.applyLateFee(tx, inv.id, 'recalculate', actorId, today);
        const change = await tx.dueDateChange.create({
          data: { schoolId, termId, oldDate: term.dueDate, newDate, reason: dto.reason, notifyParents: dto.notifyParents, affectedInvoices: affected.length, lateFeeDelta, changedById: actorId },
        });
        await this.audit.log(
          {
            schoolId,
            action: 'fees.due_date_changed',
            entityType: 'Term',
            entityId: termId,
            summary: `${term.name} ${term.academicYear.name} due date changed ${formatDateIN(oldDate)} → ${formatDateIN(dto.newDate)}: ${affected.length} invoices re-dated, late fees ${lateFeeDelta >= 0 ? '+' : '−'}${formatINR(Math.abs(lateFeeDelta))}. Reason: ${dto.reason}`,
            before: { dueDate: oldDate },
            after: { dueDate: dto.newDate, affectedInvoices: affected.length, lateFeeDelta },
          },
          tx,
        );
        return { change, affected: affected.map((a) => a.id), lateFeeDelta };
      },
      { timeout: 180_000 },
    );

    let job = null;
    if (dto.notifyParents && result.affected.length) {
      job = this.jobs.toDto(
        await this.jobs.enqueue(JOB_NOTIFY_DUE_DATE, { invoiceIds: result.affected, oldDate, termName: term.name }, { schoolId, createdById: actorId, title: `Notify parents: ${term.name} due date → ${formatDateIN(dto.newDate)}` }),
      );
    }
    return { change: result.change, affectedInvoices: result.affected.length, lateFeeDelta: result.lateFeeDelta, notifyJob: job };
  }

  async changeInvoiceDueDate(schoolId: string, invoiceId: string, dto: { newDate: string; reason: string }, actorId: string) {
    const inv = await this.prisma.invoice.findFirst({ where: { id: invoiceId, schoolId } });
    if (!inv) throw new NotFoundException('Invoice not found');
    if (inv.status === 'PAID' || inv.status === 'CANCELLED') throw new BadRequestException(`Invoice is ${inv.status.toLowerCase()}`);
    const oldDate = toISODate(inv.dueDate);
    await this.prisma.tx(async (tx) => {
      await tx.invoice.update({ where: { id: invoiceId }, data: { dueDate: dateOnly(dto.newDate) } });
      const delta = await this.ledger.applyLateFee(tx, invoiceId, 'recalculate', actorId);
      await this.ledger.recomputeInvoice(tx, invoiceId);
      await tx.dueDateChange.create({ data: { schoolId, invoiceId, oldDate: inv.dueDate, newDate: dateOnly(dto.newDate), reason: dto.reason, affectedInvoices: 1, lateFeeDelta: delta, changedById: actorId } });
      await this.audit.log(
        {
          schoolId,
          action: 'invoice.due_date_changed',
          entityType: 'Invoice',
          entityId: invoiceId,
          summary: `${inv.invoiceNo} due date ${formatDateIN(oldDate)} → ${formatDateIN(dto.newDate)} (late fee ${delta >= 0 ? '+' : '−'}${formatINR(Math.abs(delta))}). Reason: ${dto.reason}`,
          before: { dueDate: oldDate, lateFee: inv.lateFee },
          after: { dueDate: dto.newDate },
        },
        tx,
      );
    });
    return this.prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  }

  history(schoolId: string, termId?: string) {
    return this.prisma.dueDateChange.findMany({
      where: { schoolId, ...(termId ? { termId } : {}) },
      include: { term: { select: { name: true } }, invoice: { select: { invoiceNo: true } }, changedBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  private async runNotify(payload: { invoiceIds: string[]; oldDate: string; termName: string }, ctx: JobContext) {
    await ctx.setTotal(payload.invoiceIds.length);
    let sent = 0;
    for (let i = 0; i < payload.invoiceIds.length; i++) {
      try {
        sent += await this.notifier.dueDateChanged(payload.invoiceIds[i], new Date(payload.oldDate), payload.termName);
      } catch (e: any) {
        this.logger.warn(`Due date notify failed: ${e.message}`);
      }
      await ctx.progress(i + 1);
    }
    return { messagesQueued: sent };
  }
}
