import { Body, Controller, Get, HttpCode, NotFoundException, Param, Patch, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { StorageService } from '../../core/storage/storage.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import type { SchoolBranding } from '@rnsis/shared';
import { env } from '../../config/env';
import { CurrentUser, Public, RequirePermissions } from '../../common/decorators';
import type { CurrentUserData } from '../../common/context/auth-user';
import { PaginationQueryDto, pageArgs, paginated } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { JobsService } from '../../core/jobs/jobs.service';
import { PdfService } from '../../core/pdf/pdf.service';
import { SchoolService } from '../../core/settings/school.service';
import { SchoolSettings } from '../../core/settings/school-settings.schema';
import { PERMISSION_GROUPS } from '@rnsis/shared';

class AuditQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() entityType?: string;
  @IsOptional() @IsString() entityId?: string;
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() action?: string;
  @IsOptional() @IsString() from?: string;
  @IsOptional() @IsString() to?: string;
}

@ApiTags('System')
@Controller()
export class SystemController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly schools: SchoolService,
    private readonly jobs: JobsService,
    private readonly pdf: PdfService,
    private readonly storage: StorageService,
  ) {}

  @Public()
  @Get('public/logo')
  async logo(@Res() res: Response) {
    const school = await this.schools.resolvePublicSchool();
    if (!school.logoFileId) throw new NotFoundException();
    const { file, buffer } = await this.storage.read(school.logoFileId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(buffer);
  }

  @Public()
  @Get('health')
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', time: new Date().toISOString(), gateway: env.PAYMENT_GATEWAY };
  }

  /** Public branding for login page, public forms and theming. */
  @Public()
  @Get('public/branding')
  async branding(): Promise<SchoolBranding> {
    const school = await this.schools.resolvePublicSchool();
    const year = await this.schools.currentYear(school.id);
    return {
      id: school.id,
      code: school.code,
      name: school.name,
      shortName: school.shortName,
      tagline: school.tagline,
      logoUrl: school.logoFileId ? `${env.API_URL}/api/public/logo` : null,
      primaryColor: school.primaryColor,
      secondaryColor: school.secondaryColor,
      phone: school.phone,
      email: school.email,
      website: school.website,
      address: this.schools.addressOf(school),
      affiliationNo: school.affiliationNo,
      currentAcademicYear: year ? { id: year.id, name: year.name } : null,
    };
  }

  @ApiBearerAuth()
  @Get('settings')
  @RequirePermissions('settings.school')
  async settings(@CurrentUser() user: CurrentUserData) {
    const { school, settings } = await this.schools.get(user.schoolId);
    return { school, settings };
  }

  @ApiBearerAuth()
  @Patch('settings')
  @RequirePermissions('settings.school')
  updateSettings(@CurrentUser() user: CurrentUserData, @Body() patch: Partial<SchoolSettings>) {
    return this.schools.updateSettings(user.schoolId, patch);
  }

  @ApiBearerAuth()
  @Patch('settings/profile')
  @RequirePermissions('settings.school')
  async updateProfile(@CurrentUser() user: CurrentUserData, @Body() body: Record<string, unknown>) {
    const school = await this.schools.updateProfile(user.schoolId, body as any);
    this.pdf.invalidate(user.schoolId);
    return school;
  }

  @ApiBearerAuth()
  @Get('permissions/catalog')
  @RequirePermissions('settings.roles')
  catalog() {
    return PERMISSION_GROUPS;
  }

  @ApiBearerAuth()
  @Get('jobs')
  listJobs(@CurrentUser() user: CurrentUserData, @Query('type') type?: string) {
    return this.jobs.list(user.schoolId, type);
  }

  @ApiBearerAuth()
  @Get('jobs/:id')
  getJob(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.jobs.get(id, user.schoolId);
  }

  @ApiBearerAuth()
  @Post('jobs/:id/cancel')
  @HttpCode(200)
  cancelJob(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.jobs.cancel(id, user.schoolId);
  }

  @ApiBearerAuth()
  @Get('audit')
  @RequirePermissions('audit.view')
  async audit(@CurrentUser() user: CurrentUserData, @Query() q: AuditQueryDto) {
    const { skip, take, page, pageSize } = pageArgs(q);
    const where: any = {
      schoolId: user.schoolId,
      ...(q.entityType ? { entityType: q.entityType } : {}),
      ...(q.entityId ? { entityId: q.entityId } : {}),
      ...(q.userId ? { userId: q.userId } : {}),
      ...(q.action ? { action: { startsWith: q.action } } : {}),
      ...(q.from || q.to ? { createdAt: { ...(q.from ? { gte: new Date(q.from) } : {}), ...(q.to ? { lte: new Date(`${q.to}T23:59:59.999Z`) } : {}) } } : {}),
      ...(q.q ? { summary: { contains: q.q, mode: 'insensitive' } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, include: { user: { select: { id: true, name: true, username: true } } }, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.auditLog.count({ where }),
    ]);
    return paginated(items, total, page, pageSize);
  }
}
