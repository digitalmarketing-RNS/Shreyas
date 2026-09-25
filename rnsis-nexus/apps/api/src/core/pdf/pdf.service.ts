import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SchoolService } from '../settings/school.service';
import { StorageService } from '../storage/storage.service';
import { PageSizeName, PdfBranding, PdfDoc } from './pdf-doc';

/** Creates branded PdfDoc instances (logo + colours from School settings on every PDF). */
@Injectable()
export class PdfService {
  private brandingCache = new Map<string, { at: number; value: PdfBranding }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly schools: SchoolService,
    private readonly storage: StorageService,
  ) {}

  async branding(schoolId: string): Promise<PdfBranding> {
    const hit = this.brandingCache.get(schoolId);
    if (hit && Date.now() - hit.at < 60_000) return hit.value;
    const { school } = await this.schools.get(schoolId);
    let logo: Buffer | null = null;
    if (school.logoFileId) {
      try {
        logo = (await this.storage.read(school.logoFileId)).buffer;
      } catch {
        logo = null;
      }
    }
    const value: PdfBranding = {
      name: school.name,
      shortName: school.shortName,
      tagline: school.tagline,
      address: this.schools.addressOf(school),
      phone: school.phone,
      email: school.email,
      website: school.website,
      affiliationNo: school.affiliationNo,
      primaryColor: school.primaryColor,
      secondaryColor: school.secondaryColor,
      logo,
    };
    this.brandingCache.set(schoolId, { at: Date.now(), value });
    return value;
  }

  invalidate(schoolId: string) {
    this.brandingCache.delete(schoolId);
  }

  async create(schoolId: string, opts: { size?: PageSizeName; title?: string; margin?: number; addPage?: boolean } = {}) {
    return PdfDoc.create({ branding: await this.branding(schoolId), ...opts });
  }
}
