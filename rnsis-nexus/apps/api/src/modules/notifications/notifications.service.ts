import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { NotificationChannel, NotificationLog, Prisma } from '@prisma/client';
import { env } from '../../config/env';
import { PrismaService, Tx } from '../../prisma/prisma.service';
import { SchoolService } from '../../core/settings/school.service';
import { StorageService } from '../../core/storage/storage.service';
import { DEFAULT_TEMPLATES, renderTemplate } from './default-templates';
import { EmailDriver } from './drivers/email.driver';
import { SmsDriver } from './drivers/sms.driver';
import { ChannelDriver } from './drivers/types';
import { WhatsAppDriver } from './drivers/whatsapp.driver';

export interface Recipient {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  userId?: string | null;
}

export interface NotifyRequest {
  schoolId: string;
  templateKey: string;
  channels?: NotificationChannel[];
  to: Recipient;
  data: Record<string, unknown>;
  studentId?: string | null;
  related?: { type: string; id: string };
  attachments?: { fileId: string; filename: string }[];
  broadcastId?: string;
  scheduledAt?: Date;
}

const DEFAULT_CHANNELS: NotificationChannel[] = ['EMAIL', 'SMS', 'WHATSAPP'];

/**
 * Transactional outbox for Email / SMS / WhatsApp. `notify()` renders the school's editable
 * template and writes NotificationLog rows inside the caller's transaction; a dispatcher
 * loop then delivers them with retries and records provider ids — so a message is only
 * ever sent for a change that actually committed, and every message is auditable.
 */
@Injectable()
export class NotificationsService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly drivers: Record<Exclude<NotificationChannel, 'IN_APP'>, ChannelDriver> = {
    EMAIL: new EmailDriver(),
    SMS: new SmsDriver(),
    WHATSAPP: new WhatsAppDriver(),
  };
  private timer?: NodeJS.Timeout;
  private busy = false;
  private templateCache = new Map<string, { at: number; rows: Map<string, any> }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly schools: SchoolService,
    private readonly storage: StorageService,
  ) {}

  async onApplicationBootstrap() {
    if (!env.JOBS_ENABLED) return;
    await this.prisma.notificationLog.updateMany({
      where: { status: 'SENDING', createdAt: { lt: new Date(Date.now() - 10 * 60 * 1000) } },
      data: { status: 'QUEUED' },
    });
    this.timer = setInterval(() => void this.dispatch(), 1500);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async templates(schoolId: string) {
    const hit = this.templateCache.get(schoolId);
    if (hit && Date.now() - hit.at < 30_000) return hit.rows;
    const rows = await this.prisma.messageTemplate.findMany({ where: { schoolId } });
    const map = new Map<string, any>();
    for (const r of rows) map.set(`${r.key}:${r.channel}`, r);
    this.templateCache.set(schoolId, { at: Date.now(), rows: map });
    return map;
  }

  invalidateTemplates(schoolId: string) {
    this.templateCache.delete(schoolId);
  }

  async resolveTemplate(schoolId: string, key: string, channel: NotificationChannel) {
    const db = (await this.templates(schoolId)).get(`${key}:${channel}`);
    if (db) return db.active ? db : null;
    return DEFAULT_TEMPLATES.find((t) => t.key === key && t.channel === channel) ?? null;
  }

  /** Queue a templated message on each requested channel the recipient can receive. */
  async notify(req: NotifyRequest, tx?: Tx): Promise<number> {
    const client = tx ?? this.prisma;
    const { school, settings } = await this.schools.get(req.schoolId);
    const data: Record<string, unknown> = {
      school_name: school.name,
      school_phone: school.phone ?? '',
      school_email: school.email ?? '',
      portal_url: `${env.APP_URL}/login`,
      ...req.data,
    };
    let queued = 0;
    for (const channel of req.channels ?? DEFAULT_CHANNELS) {
      if (channel === 'EMAIL' && (!settings.notifications.email || !req.to.email)) continue;
      if (channel === 'SMS' && (!settings.notifications.sms || !req.to.phone)) continue;
      if (channel === 'WHATSAPP' && (!settings.notifications.whatsapp || !req.to.phone)) continue;
      if (channel === 'IN_APP' && !req.to.userId) continue;
      const tpl = await this.resolveTemplate(req.schoolId, req.templateKey, channel);
      if (!tpl) continue;
      const body = renderTemplate(tpl.body, data);
      const subject = tpl.subject ? renderTemplate(tpl.subject, data) : null;

      if (channel === 'IN_APP') {
        await client.inAppNotification.create({
          data: { schoolId: req.schoolId, userId: req.to.userId!, title: subject ?? req.templateKey, body, link: (req.data.link as string) ?? null },
        });
        queued++;
        continue;
      }
      const variableOrder: string[] = tpl.variables ?? [];
      await client.notificationLog.create({
        data: {
          schoolId: req.schoolId,
          channel,
          recipient: channel === 'EMAIL' ? req.to.email! : req.to.phone!,
          recipientName: req.to.name ?? null,
          userId: req.to.userId ?? null,
          studentId: req.studentId ?? null,
          templateKey: req.templateKey,
          subject,
          body,
          relatedType: req.related?.type,
          relatedId: req.related?.id,
          broadcastId: req.broadcastId,
          attachments: (channel === 'EMAIL' ? req.attachments ?? [] : []) as Prisma.InputJsonValue,
          scheduledAt: req.scheduledAt ?? new Date(),
          meta: {
            variableOrder,
            variables: Object.fromEntries(variableOrder.map((k) => [k, data[k] === undefined || data[k] === null ? '' : String(data[k])])),
            whatsappTemplateName: tpl.whatsappTemplateName ?? null,
            whatsappLanguage: tpl.whatsappLanguage ?? 'en',
            smsDltTemplateId: tpl.smsDltTemplateId ?? null,
          },
        },
      });
      queued++;
    }
    return queued;
  }

  /** Notify every guardian of a student who opted into notifications (primary first). */
  async notifyGuardians(
    studentId: string,
    req: Omit<NotifyRequest, 'to' | 'studentId' | 'schoolId'> & { schoolId?: string },
    tx?: Tx,
  ): Promise<number> {
    const client = tx ?? this.prisma;
    const student = await client.student.findUnique({
      where: { id: studentId },
      include: { guardians: { include: { guardian: true }, orderBy: { isPrimary: 'desc' } } },
    });
    if (!student) return 0;
    let links = student.guardians.filter((g) => g.receivesNotifications);
    if (!links.length) links = student.guardians.filter((g) => g.isPrimary).slice(0, 1);
    let n = 0;
    for (const link of links) {
      n += await this.notify(
        {
          ...req,
          schoolId: student.schoolId,
          studentId,
          to: { name: link.guardian.name, email: link.guardian.email, phone: link.guardian.phone, userId: link.guardian.userId },
          data: { parent_name: link.guardian.name, student_name: `${student.firstName} ${student.lastName}`, ...req.data },
        },
        tx,
      );
    }
    return n;
  }

  async notifyUser(schoolId: string, userId: string, templateKey: string, data: Record<string, unknown>, channels: NotificationChannel[] = ['IN_APP'], tx?: Tx) {
    const user = await (tx ?? this.prisma).user.findUnique({ where: { id: userId } });
    if (!user) return 0;
    return this.notify({ schoolId, templateKey, channels, to: { name: user.name, email: user.email, phone: user.phone, userId }, data: { name: user.name, ...data } }, tx);
  }

  /** In-app alert to every active user whose role holds `permission` (approval queues). */
  async notifyPermissionHolders(schoolId: string, permission: string, title: string, body: string, link?: string, excludeUserId?: string, tx?: Tx) {
    const client = tx ?? this.prisma;
    const users = await client.user.findMany({
      where: { schoolId, status: 'ACTIVE', role: { permissions: { some: { permission } } }, ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}) },
      select: { id: true },
      take: 50,
    });
    if (users.length) await client.inAppNotification.createMany({ data: users.map((u) => ({ schoolId, userId: u.id, title, body, link: link ?? null })) });
    return users.length;
  }

  /** Deliver queued messages. Safe to run on many replicas (SKIP LOCKED). */
  async dispatch(limit = 25): Promise<number> {
    if (this.busy) return 0;
    this.busy = true;
    try {
      const batch = await this.prisma.$queryRaw<NotificationLog[]>`
        UPDATE "NotificationLog" SET "status" = 'SENDING'::"NotificationStatus", "attempts" = "attempts" + 1
         WHERE "id" IN (
           SELECT "id" FROM "NotificationLog"
            WHERE "status" = 'QUEUED'::"NotificationStatus" AND "scheduledAt" <= now()
            ORDER BY "createdAt" LIMIT ${limit}
            FOR UPDATE SKIP LOCKED)
        RETURNING *`;
      await Promise.all(batch.map((log) => this.deliver(log)));
      return batch.length;
    } catch (e: any) {
      this.logger.error(`Dispatch failed: ${e.message}`);
      return 0;
    } finally {
      this.busy = false;
    }
  }

  private async deliver(log: NotificationLog) {
    const meta = (log.meta ?? {}) as any;
    try {
      const attachments: { filename: string; content: Buffer; contentType: string }[] = [];
      for (const a of (log.attachments as any[]) ?? []) {
        try {
          const { file, buffer } = await this.storage.read(a.fileId);
          attachments.push({ filename: a.filename ?? file.originalName, content: buffer, contentType: file.mimeType });
        } catch {
          /* missing attachment should not block the message */
        }
      }
      const driver = this.drivers[log.channel as Exclude<NotificationChannel, 'IN_APP'>];
      const res = await driver.send({
        to: log.recipient,
        toName: log.recipientName,
        subject: log.subject,
        body: log.body,
        variables: meta.variables,
        variableOrder: meta.variableOrder,
        whatsappTemplateName: meta.whatsappTemplateName,
        whatsappLanguage: meta.whatsappLanguage,
        smsDltTemplateId: meta.smsDltTemplateId,
        attachments,
      });
      await this.prisma.notificationLog.update({
        where: { id: log.id },
        data: { status: res.status, provider: res.provider, providerMessageId: res.providerMessageId ?? null, sentAt: new Date(), error: null },
      });
    } catch (e: any) {
      const retry = log.attempts < 3;
      await this.prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: retry ? 'QUEUED' : 'FAILED',
          error: String(e?.message ?? e).slice(0, 1000),
          scheduledAt: retry ? new Date(Date.now() + 2 ** log.attempts * 60_000) : undefined,
        },
      });
    }
  }

  /** WhatsApp / SMS delivery receipts. */
  async markDelivered(providerMessageId: string, status: 'DELIVERED' | 'FAILED', error?: string) {
    await this.prisma.notificationLog.updateMany({ where: { providerMessageId }, data: { status, error: error ?? null } });
  }
}
