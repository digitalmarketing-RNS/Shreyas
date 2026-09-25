import { Injectable, Logger, NotFoundException, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { BackgroundJob, Prisma } from '@prisma/client';
import { hostname } from 'os';
import type { JobDto } from '@rnsis/shared';
import { env } from '../../config/env';
import { RequestContext } from '../../common/context/request-context';
import { PrismaService } from '../../prisma/prisma.service';

export interface JobContext {
  job: BackgroundJob;
  /** Report progress; writes are throttled so a 4,000-row job doesn't hammer the DB. */
  progress(processed: number, opts?: { total?: number; failed?: number }): Promise<void>;
  setTotal(total: number): Promise<void>;
  isCancelled(): Promise<boolean>;
}

export type JobHandler = (payload: any, ctx: JobContext) => Promise<unknown>;

export interface EnqueueOptions {
  schoolId: string;
  createdById?: string | null;
  title?: string;
  runAfter?: Date;
  maxAttempts?: number;
}

/**
 * Durable Postgres-backed job queue. Jobs are claimed with FOR UPDATE SKIP LOCKED, so any
 * number of API replicas can run workers safely. Used for bulk invoice generation, bulk
 * reminders, imports, ID-card batches, notification dispatch and backups — every long task
 * exposes live progress to the UI through GET /jobs/:id.
 */
@Injectable()
export class JobsService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(JobsService.name);
  private readonly handlers = new Map<string, JobHandler>();
  private readonly workerId = `${hostname()}:${process.pid}`;
  private readonly concurrency = 3;
  private running = 0;
  private timer?: NodeJS.Timeout;
  private stopping = false;

  constructor(private readonly prisma: PrismaService) {}

  register(type: string, handler: JobHandler) {
    this.handlers.set(type, handler);
  }

  async onApplicationBootstrap() {
    if (!env.JOBS_ENABLED) return;
    // Recover jobs orphaned by a crash/restart.
    await this.prisma.backgroundJob.updateMany({
      where: { status: 'RUNNING', lockedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) } },
      data: { status: 'QUEUED', lockedAt: null, lockedBy: null },
    });
    this.timer = setInterval(() => void this.tick(), 750);
  }

  async onModuleDestroy() {
    this.stopping = true;
    if (this.timer) clearInterval(this.timer);
    const deadline = Date.now() + 10_000;
    while (this.running > 0 && Date.now() < deadline) await new Promise((r) => setTimeout(r, 100));
  }

  async enqueue(type: string, payload: Record<string, unknown>, opts: EnqueueOptions): Promise<BackgroundJob> {
    if (!this.handlers.has(type)) throw new Error(`No handler registered for job type ${type}`);
    return this.prisma.backgroundJob.create({
      data: {
        schoolId: opts.schoolId,
        type,
        title: opts.title,
        payload: payload as Prisma.InputJsonValue,
        createdById: opts.createdById ?? null,
        runAfter: opts.runAfter ?? new Date(),
        maxAttempts: opts.maxAttempts ?? 1,
      },
    });
  }

  toDto(job: BackgroundJob): JobDto {
    return {
      id: job.id,
      type: job.type,
      title: job.title,
      status: job.status,
      total: job.total,
      processed: job.processed,
      failed: job.failed,
      progress: job.total > 0 ? Math.min(100, Math.round((job.processed / job.total) * 100)) : job.status === 'COMPLETED' ? 100 : 0,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt.toISOString(),
      startedAt: job.startedAt?.toISOString() ?? null,
      finishedAt: job.finishedAt?.toISOString() ?? null,
    };
  }

  async get(id: string, schoolId: string): Promise<JobDto> {
    const job = await this.prisma.backgroundJob.findFirst({ where: { id, schoolId } });
    if (!job) throw new NotFoundException('Job not found');
    return this.toDto(job);
  }

  async list(schoolId: string, type?: string, take = 20): Promise<JobDto[]> {
    const jobs = await this.prisma.backgroundJob.findMany({
      where: { schoolId, ...(type ? { type } : {}) },
      orderBy: { createdAt: 'desc' },
      take,
    });
    return jobs.map((j) => this.toDto(j));
  }

  async cancel(id: string, schoolId: string) {
    await this.prisma.backgroundJob.updateMany({ where: { id, schoolId, status: { in: ['QUEUED', 'RUNNING'] } }, data: { status: 'CANCELLED', finishedAt: new Date() } });
    return this.get(id, schoolId);
  }

  /** Poll until a job finishes (tests and small synchronous-feeling operations). */
  async waitFor(id: string, timeoutMs = 60_000): Promise<BackgroundJob> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const job = await this.prisma.backgroundJob.findUniqueOrThrow({ where: { id } });
      if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(job.status)) return job;
      if (Date.now() > deadline) throw new Error(`Timed out waiting for job ${id}`);
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  private async tick() {
    if (this.stopping) return;
    while (this.running < this.concurrency) {
      const job = await this.claim().catch((e) => {
        this.logger.error(`Job claim failed: ${e.message}`);
        return null;
      });
      if (!job) return;
      this.running++;
      void this.execute(job).finally(() => this.running--);
    }
  }

  private async claim(): Promise<BackgroundJob | null> {
    const types = [...this.handlers.keys()];
    if (!types.length) return null;
    const rows = await this.prisma.$queryRaw<BackgroundJob[]>`
      UPDATE "BackgroundJob"
         SET "status" = 'RUNNING'::"JobStatus", "lockedAt" = now(), "lockedBy" = ${this.workerId},
             "startedAt" = COALESCE("startedAt", now()), "attempts" = "attempts" + 1
       WHERE "id" = (
         SELECT "id" FROM "BackgroundJob"
          WHERE "status" = 'QUEUED'::"JobStatus" AND "runAfter" <= now() AND "type" = ANY(${types}::text[])
          ORDER BY "createdAt"
          FOR UPDATE SKIP LOCKED
          LIMIT 1)
      RETURNING *`;
    return rows[0] ?? null;
  }

  private async execute(job: BackgroundJob) {
    const handler = this.handlers.get(job.type)!;
    let lastWrite = 0;
    let state = { processed: job.processed, total: job.total, failed: job.failed };
    const flush = () => this.prisma.backgroundJob.update({ where: { id: job.id }, data: { ...state, lockedAt: new Date() } });

    const ctx: JobContext = {
      job,
      progress: async (processed, opts) => {
        state = { processed, total: opts?.total ?? state.total, failed: opts?.failed ?? state.failed };
        if (Date.now() - lastWrite > 400) {
          lastWrite = Date.now();
          await flush();
        }
      },
      setTotal: async (total) => {
        state.total = total;
        lastWrite = Date.now();
        await flush();
      },
      isCancelled: async () => (await this.prisma.backgroundJob.findUnique({ where: { id: job.id }, select: { status: true } }))?.status === 'CANCELLED',
    };

    try {
      const result = await RequestContext.run({ requestId: `job:${job.id}`, schoolId: job.schoolId, userId: job.createdById ?? undefined }, () =>
        handler(job.payload, ctx),
      );
      const current = await this.prisma.backgroundJob.findUnique({ where: { id: job.id }, select: { status: true } });
      await this.prisma.backgroundJob.update({
        where: { id: job.id },
        data: {
          ...state,
          status: current?.status === 'CANCELLED' ? 'CANCELLED' : 'COMPLETED',
          result: (result ?? null) as Prisma.InputJsonValue,
          finishedAt: new Date(),
          lockedAt: null,
          lockedBy: null,
        },
      });
    } catch (e: any) {
      const retry = job.attempts < job.maxAttempts;
      this.logger.error(`Job ${job.type} ${job.id} failed (attempt ${job.attempts}/${job.maxAttempts}): ${e?.message}`, e?.stack);
      await this.prisma.backgroundJob.update({
        where: { id: job.id },
        data: {
          ...state,
          status: retry ? 'QUEUED' : 'FAILED',
          error: String(e?.message ?? e).slice(0, 2000),
          runAfter: retry ? new Date(Date.now() + 2 ** job.attempts * 5000) : undefined,
          finishedAt: retry ? null : new Date(),
          lockedAt: null,
          lockedBy: null,
        },
      });
    }
  }
}
