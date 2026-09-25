import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { CurrentUser, RequirePermissions } from '../../common/decorators';
import type { CurrentUserData } from '../../common/context/auth-user';
import { PaginationQueryDto, pageArgs, paginated } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../core/audit/audit.service';
import { DEFAULT_TEMPLATES, renderTemplate } from './default-templates';
import { NotificationsService } from './notifications.service';

class UpdateTemplateDto {
  @IsOptional() @IsString() @MaxLength(200) subject?: string;
  @IsOptional() @IsString() @MaxLength(4000) body?: string;
  @IsOptional() @IsString() @MaxLength(100) whatsappTemplateName?: string;
  @IsOptional() @IsString() @MaxLength(60) smsDltTemplateId?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}

class OutboxQueryDto extends PaginationQueryDto {
  @IsOptional() @IsIn(['EMAIL', 'SMS', 'WHATSAPP']) channel?: NotificationChannel;
  @IsOptional() @IsString() status?: NotificationStatus;
  @IsOptional() @IsString() templateKey?: string;
  @IsOptional() @IsString() studentId?: string;
}

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  @Get('templates')
  @RequirePermissions('notifications.templates')
  async templates(@CurrentUser() user: CurrentUserData) {
    const rows = await this.prisma.messageTemplate.findMany({ where: { schoolId: user.schoolId }, orderBy: [{ key: 'asc' }, { channel: 'asc' }] });
    const have = new Set(rows.map((r) => `${r.key}:${r.channel}`));
    const missing = DEFAULT_TEMPLATES.filter((t) => !have.has(`${t.key}:${t.channel}`)).map((t) => ({ ...t, id: null, active: true, isDefault: true }));
    return [...rows.map((r) => ({ ...r, isDefault: false })), ...missing];
  }

  @Patch('templates/:key/:channel')
  @RequirePermissions('notifications.templates')
  async updateTemplate(@CurrentUser() user: CurrentUserData, @Param('key') key: string, @Param('channel') channel: NotificationChannel, @Body() dto: UpdateTemplateDto) {
    const def = DEFAULT_TEMPLATES.find((t) => t.key === key && t.channel === channel);
    const existing = await this.prisma.messageTemplate.findUnique({ where: { schoolId_key_channel: { schoolId: user.schoolId, key, channel } } });
    const row = await this.prisma.messageTemplate.upsert({
      where: { schoolId_key_channel: { schoolId: user.schoolId, key, channel } },
      create: {
        schoolId: user.schoolId,
        key,
        channel,
        name: def?.name ?? key,
        subject: dto.subject ?? def?.subject,
        body: dto.body ?? def?.body ?? '',
        variables: def?.variables ?? [],
        whatsappTemplateName: dto.whatsappTemplateName ?? def?.whatsappTemplateName,
        smsDltTemplateId: dto.smsDltTemplateId,
        active: dto.active ?? true,
      },
      update: { ...dto },
    });
    this.notifications.invalidateTemplates(user.schoolId);
    await this.audit.log({ action: 'template.updated', entityType: 'MessageTemplate', entityId: row.id, summary: `Template ${key}/${channel} updated`, before: existing, after: row });
    return row;
  }

  @Post('templates/:key/:channel/preview')
  @RequirePermissions('notifications.templates')
  @HttpCode(200)
  async preview(@CurrentUser() user: CurrentUserData, @Param('key') key: string, @Param('channel') channel: NotificationChannel, @Body() body: { body?: string; subject?: string }) {
    const tpl = await this.notifications.resolveTemplate(user.schoolId, key, channel);
    const sample: Record<string, string> = {
      parent_name: 'Mrs. Lakshmi Rao', student_name: 'Aarav Rao', grade: 'Grade 3', class_name: 'Grade 3 - A', enquiry_no: 'ENQ/2026-27/00042',
      application_no: 'RNSIS-2026-27-0042', admission_no: 'RNSIS/2026/00042', invoice_no: 'INV/2026-27/00042', receipt_no: 'RCPT/2026-27/00042',
      amount_due: '₹45,000', amount: '₹45,000', balance: '₹0', due_date: '15 Oct 2026', old_date: '15 Oct 2026', new_date: '30 Oct 2026', term: 'Term 2', days: '7',
      mode: 'UPI', paid_on: '12 Oct 2026', pay_url: 'https://rnsis.edu.in/pay/…', track_url: 'https://rnsis.edu.in/track', school_name: 'RNSIS International School',
      title: 'Term 2 Fees 2026-27', username: 'lakshmi.rao', password: '••••••••', subject: 'Mathematics', date: '12 Oct 2026', late_fee: '', apply_url: 'https://rnsis.edu.in/apply',
    };
    return { subject: renderTemplate(body.subject ?? tpl?.subject ?? '', sample), body: renderTemplate(body.body ?? tpl?.body ?? '', sample) };
  }

  @Get('outbox')
  @RequirePermissions('notifications.log')
  async outbox(@CurrentUser() user: CurrentUserData, @Query() q: OutboxQueryDto) {
    const { skip, take, page, pageSize } = pageArgs(q);
    const where: any = {
      schoolId: user.schoolId,
      ...(q.channel ? { channel: q.channel } : {}),
      ...(q.status ? { status: q.status } : {}),
      ...(q.templateKey ? { templateKey: q.templateKey } : {}),
      ...(q.studentId ? { studentId: q.studentId } : {}),
      ...(q.q ? { OR: [{ recipient: { contains: q.q } }, { recipientName: { contains: q.q, mode: 'insensitive' } }] } : {}),
    };
    const [items, total, stats] = await Promise.all([
      this.prisma.notificationLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.notificationLog.count({ where }),
      this.prisma.notificationLog.groupBy({ by: ['channel', 'status'], where: { schoolId: user.schoolId, createdAt: { gte: new Date(Date.now() - 30 * 86400_000) } }, _count: true }),
    ]);
    return { ...paginated(items, total, page, pageSize), stats: stats.map((s) => ({ channel: s.channel, status: s.status, count: s._count })) };
  }

  @Post('outbox/:id/retry')
  @RequirePermissions('notifications.log')
  @HttpCode(200)
  async retry(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    await this.prisma.notificationLog.updateMany({ where: { id, schoolId: user.schoolId, status: 'FAILED' }, data: { status: 'QUEUED', attempts: 0, scheduledAt: new Date() } });
    return { ok: true };
  }

  @Get('inbox')
  async inbox(@CurrentUser() user: CurrentUserData) {
    const [items, unread] = await Promise.all([
      this.prisma.inAppNotification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 30 }),
      this.prisma.inAppNotification.count({ where: { userId: user.id, readAt: null } }),
    ]);
    return { items, unread };
  }

  @Post('inbox/read-all')
  @HttpCode(204)
  async readAll(@CurrentUser() user: CurrentUserData) {
    await this.prisma.inAppNotification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  }

  @Post('inbox/:id/read')
  @HttpCode(204)
  async read(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    await this.prisma.inAppNotification.updateMany({ where: { id, userId: user.id }, data: { readAt: new Date() } });
  }
}
