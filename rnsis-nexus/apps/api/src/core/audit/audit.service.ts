import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService, Tx } from '../../prisma/prisma.service';
import { RequestContext } from '../../common/context/request-context';

export interface AuditEntry {
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  before?: unknown;
  after?: unknown;
  meta?: unknown;
  schoolId?: string;
  userId?: string | null;
}

const toJson = (v: unknown): Prisma.InputJsonValue | undefined =>
  v === undefined || v === null ? undefined : (JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue);

/**
 * Immutable audit trail of every sensitive action (who, what, when, IP). Callers pass a
 * transaction client so the audit row commits atomically with the change it describes.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry, tx?: Tx): Promise<void> {
    const ctx = RequestContext.get();
    const schoolId = entry.schoolId ?? ctx?.schoolId;
    if (!schoolId) {
      this.logger.warn(`Audit entry without school context: ${entry.action}`);
      return;
    }
    const client = tx ?? this.prisma;
    await client.auditLog.create({
      data: {
        schoolId,
        userId: entry.userId === undefined ? ctx?.userId ?? null : entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        summary: entry.summary.slice(0, 1000),
        before: toJson(entry.before),
        after: toJson(entry.after),
        meta: toJson(entry.meta),
        ip: ctx?.ip ?? null,
        userAgent: ctx?.userAgent ?? null,
      },
    });
  }
}
