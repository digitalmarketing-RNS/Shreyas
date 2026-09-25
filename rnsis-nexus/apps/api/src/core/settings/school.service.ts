import { Injectable, NotFoundException } from '@nestjs/common';
import { School } from '@prisma/client';
import { env } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { parseSettings, SchoolSettings } from './school-settings.schema';

function deepMerge<T>(base: T, patch: any): T {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return (patch ?? base) as T;
  const out: any = { ...(base as any) };
  for (const [k, v] of Object.entries(patch)) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? deepMerge((base as any)?.[k] ?? {}, v) : v;
  }
  return out;
}

/** School profile, branding and typed settings. Also resolves the school for public routes. */
@Injectable()
export class SchoolService {
  private cache = new Map<string, { at: number; school: School; settings: SchoolSettings }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Single-tenant today: public routes resolve the school from SCHOOL_CODE. */
  async resolvePublicSchool(): Promise<School> {
    const school = await this.prisma.school.findUnique({ where: { code: env.SCHOOL_CODE } });
    if (!school) throw new NotFoundException('School is not configured. Run the seed script.');
    return school;
  }

  async get(schoolId: string): Promise<{ school: School; settings: SchoolSettings }> {
    const hit = this.cache.get(schoolId);
    if (hit && Date.now() - hit.at < 15_000) return hit;
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');
    const value = { at: Date.now(), school, settings: parseSettings(school.settings) };
    this.cache.set(schoolId, value);
    return value;
  }

  async settings(schoolId: string): Promise<SchoolSettings> {
    return (await this.get(schoolId)).settings;
  }

  async updateSettings(schoolId: string, patch: Partial<SchoolSettings>): Promise<SchoolSettings> {
    const current = await this.settings(schoolId);
    const next = parseSettings(deepMerge(current, patch));
    await this.prisma.school.update({ where: { id: schoolId }, data: { settings: next as any } });
    await this.audit.log({ schoolId, action: 'settings.updated', entityType: 'School', entityId: schoolId, summary: 'School settings updated', before: current, after: next });
    this.cache.delete(schoolId);
    return next;
  }

  async updateProfile(schoolId: string, data: Partial<School>) {
    const before = await this.prisma.school.findUniqueOrThrow({ where: { id: schoolId } });
    const allowed: (keyof School)[] = [
      'name', 'shortName', 'tagline', 'affiliationNo', 'board', 'addressLine1', 'addressLine2', 'city', 'state', 'pincode',
      'phone', 'email', 'website', 'logoFileId', 'primaryColor', 'secondaryColor',
    ];
    const patch: any = {};
    for (const k of allowed) if (k in data) patch[k] = (data as any)[k];
    const school = await this.prisma.school.update({ where: { id: schoolId }, data: patch });
    await this.audit.log({ schoolId, action: 'school.profile_updated', entityType: 'School', entityId: schoolId, summary: 'School profile / branding updated', before, after: school });
    this.cache.delete(schoolId);
    return school;
  }

  addressOf(s: School): string {
    return [s.addressLine1, s.addressLine2, s.city, s.state && s.pincode ? `${s.state} - ${s.pincode}` : s.state].filter(Boolean).join(', ');
  }

  async currentYear(schoolId: string) {
    return this.prisma.academicYear.findFirst({ where: { schoolId, isCurrent: true } });
  }

  async currentYearOrThrow(schoolId: string) {
    const y = await this.currentYear(schoolId);
    if (!y) throw new NotFoundException('No current academic year is configured.');
    return y;
  }
}
