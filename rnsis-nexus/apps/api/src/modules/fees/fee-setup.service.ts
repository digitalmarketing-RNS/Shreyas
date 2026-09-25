import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FeeApplicability, FeeCategory, FeeFrequency, LateFeeFrequency, LateFeeMode } from '@prisma/client';
import { computeLateFee, formatINR, rupeesToPaise, todayIST, addDays } from '@rnsis/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../core/audit/audit.service';
import { ExcelService } from '../../core/excel/excel.service';

export interface StructureItemInput {
  feeHeadId: string;
  amount: number;
  frequency: FeeFrequency;
  termId?: string | null;
  isOptional?: boolean;
  applicability?: FeeApplicability;
}

@Injectable()
export class FeeSetupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly excel: ExcelService,
  ) {}

  /* ------------------------------ Fee heads ------------------------------ */

  heads(schoolId: string) {
    return this.prisma.feeHead.findMany({ where: { schoolId }, orderBy: [{ priority: 'asc' }, { name: 'asc' }] });
  }

  async createHead(schoolId: string, dto: { name: string; code: string; category: FeeCategory; description?: string; isRefundable?: boolean; priority?: number }) {
    if (dto.category === 'LATE_FEE') throw new BadRequestException('The late fee head is managed by the system');
    const code = dto.code.toUpperCase();
    if (await this.prisma.feeHead.findUnique({ where: { schoolId_code: { schoolId, code } } })) throw new ConflictException(`Fee head code ${code} already exists`);
    const head = await this.prisma.feeHead.create({ data: { schoolId, ...dto, code } });
    await this.audit.log({ schoolId, action: 'fee_head.created', entityType: 'FeeHead', entityId: head.id, summary: `Fee head ${head.name} (${code}) created`, after: head });
    return head;
  }

  async updateHead(schoolId: string, id: string, dto: { name?: string; description?: string; isRefundable?: boolean; priority?: number; active?: boolean }) {
    const before = await this.prisma.feeHead.findFirst({ where: { id, schoolId } });
    if (!before) throw new NotFoundException('Fee head not found');
    if (before.isSystem && dto.active === false) throw new BadRequestException('System fee heads cannot be deactivated');
    const head = await this.prisma.feeHead.update({ where: { id }, data: dto });
    await this.audit.log({ schoolId, action: 'fee_head.updated', entityType: 'FeeHead', entityId: id, summary: `Fee head ${head.name} updated`, before, after: head });
    return head;
  }

  /* ------------------------------ Structures ------------------------------ */

  private summarize(structure: { items: { amount: number; frequency: FeeFrequency; termId: string | null; isOptional: boolean }[] }, terms: { id: string; name: string; sequence: number; startDate: Date; endDate: Date }[]) {
    const perTerm = terms.map((t) => {
      const recurring = structure.items.filter((i) => !i.isOptional && i.frequency === 'PER_TERM').reduce((a, i) => a + i.amount, 0);
      const annual = structure.items
        .filter((i) => !i.isOptional && i.frequency === 'ANNUAL' && (i.termId ? i.termId === t.id : t.sequence === 1))
        .reduce((a, i) => a + i.amount, 0);
      const months = Math.max(1, (t.endDate.getUTCFullYear() - t.startDate.getUTCFullYear()) * 12 + t.endDate.getUTCMonth() - t.startDate.getUTCMonth() + 1);
      return { termId: t.id, name: t.name, amount: recurring + annual, recurring, annual, months, monthlyEquivalent: Math.round((recurring + annual) / months) };
    });
    const oneTime = structure.items.filter((i) => !i.isOptional && i.frequency === 'ONE_TIME').reduce((a, i) => a + i.amount, 0);
    const annualTotal = perTerm.reduce((a, t) => a + t.amount, 0);
    return { perTerm, oneTime, annualTotal, firstYearTotal: annualTotal + oneTime, monthlyEquivalent: Math.round(annualTotal / 12) };
  }

  async structures(schoolId: string, academicYearId?: string) {
    const year = academicYearId
      ? await this.prisma.academicYear.findFirst({ where: { id: academicYearId, schoolId }, include: { terms: { orderBy: { sequence: 'asc' } } } })
      : await this.prisma.academicYear.findFirst({ where: { schoolId, isCurrent: true }, include: { terms: { orderBy: { sequence: 'asc' } } } });
    if (!year) throw new NotFoundException('Academic year not found');
    const [grades, structures] = await Promise.all([
      this.prisma.grade.findMany({ where: { schoolId }, orderBy: { order: 'asc' } }),
      this.prisma.feeStructure.findMany({ where: { academicYearId: year.id }, include: { items: { include: { feeHead: true, term: true }, orderBy: { sortOrder: 'asc' } } } }),
    ]);
    return {
      academicYear: { id: year.id, name: year.name },
      terms: year.terms,
      grades: grades.map((g) => {
        const s = structures.find((x) => x.gradeId === g.id);
        return { grade: g, structure: s ?? null, summary: s ? this.summarize(s, year.terms) : null };
      }),
    };
  }

  async structure(schoolId: string, id: string) {
    const s = await this.prisma.feeStructure.findFirst({
      where: { id, schoolId },
      include: { grade: true, academicYear: { include: { terms: { orderBy: { sequence: 'asc' } } } }, items: { include: { feeHead: true, term: true }, orderBy: { sortOrder: 'asc' } } },
    });
    if (!s) throw new NotFoundException('Fee structure not found');
    return { ...s, summary: this.summarize(s, s.academicYear.terms) };
  }

  /** Create or replace the fee plan for a grade in a year. Old/new versions go to the audit log. */
  async upsertStructure(schoolId: string, dto: { academicYearId: string; gradeId: string; name?: string; description?: string; status?: 'DRAFT' | 'ACTIVE'; items: StructureItemInput[] }) {
    const [year, grade] = await Promise.all([
      this.prisma.academicYear.findFirst({ where: { id: dto.academicYearId, schoolId }, include: { terms: true } }),
      this.prisma.grade.findFirst({ where: { id: dto.gradeId, schoolId } }),
    ]);
    if (!year || !grade) throw new NotFoundException('Academic year or grade not found');
    const heads = await this.prisma.feeHead.findMany({ where: { schoolId, id: { in: dto.items.map((i) => i.feeHeadId) } } });
    for (const it of dto.items) {
      const h = heads.find((x) => x.id === it.feeHeadId);
      if (!h) throw new BadRequestException('Unknown fee head in items');
      if (h.category === 'LATE_FEE') throw new BadRequestException('Late fee is configured by the late fee rule, not in the structure');
      if (!Number.isInteger(it.amount) || it.amount < 0) throw new BadRequestException(`Invalid amount for ${h.name}`);
      if (it.termId && !year.terms.some((t) => t.id === it.termId)) throw new BadRequestException(`Term for ${h.name} is not in ${year.name}`);
    }
    const before = await this.prisma.feeStructure.findUnique({ where: { academicYearId_gradeId: { academicYearId: year.id, gradeId: grade.id } }, include: { items: true } });
    const result = await this.prisma.$transaction(async (tx) => {
      const s = await tx.feeStructure.upsert({
        where: { academicYearId_gradeId: { academicYearId: year.id, gradeId: grade.id } },
        create: { schoolId, academicYearId: year.id, gradeId: grade.id, name: dto.name ?? `${grade.name} · ${year.name}`, description: dto.description, status: dto.status ?? 'ACTIVE' },
        update: { name: dto.name, description: dto.description, status: dto.status },
      });
      await tx.feeStructureItem.deleteMany({ where: { feeStructureId: s.id } });
      await tx.feeStructureItem.createMany({
        data: dto.items.map((i, idx) => ({
          feeStructureId: s.id,
          feeHeadId: i.feeHeadId,
          amount: i.amount,
          frequency: i.frequency,
          termId: i.termId ?? null,
          isOptional: i.isOptional ?? false,
          applicability: i.applicability ?? 'ALL',
          sortOrder: idx,
        })),
      });
      return s;
    });
    await this.audit.log({
      schoolId,
      action: before ? 'fee_structure.updated' : 'fee_structure.created',
      entityType: 'FeeStructure',
      entityId: result.id,
      summary: `Fee structure for ${grade.name} ${year.name} ${before ? 'updated' : 'created'} (${dto.items.length} items). Existing invoices are unchanged.`,
      before: before?.items,
      after: dto.items,
    });
    return this.structure(schoolId, result.id);
  }

  async copyStructure(schoolId: string, sourceId: string, targetGradeIds: string[]) {
    const src = await this.structure(schoolId, sourceId);
    const results = [];
    for (const gradeId of targetGradeIds) {
      results.push(
        await this.upsertStructure(schoolId, {
          academicYearId: src.academicYearId,
          gradeId,
          items: src.items.map((i) => ({ feeHeadId: i.feeHeadId, amount: i.amount, frequency: i.frequency, termId: i.termId, isOptional: i.isOptional, applicability: i.applicability })),
        }),
      );
    }
    return { copied: results.length };
  }

  /* ------------------------------ Late fee rule ------------------------------ */

  async lateFeeRule(schoolId: string, academicYearId: string) {
    const year = await this.prisma.academicYear.findFirst({ where: { id: academicYearId, schoolId } });
    if (!year) throw new NotFoundException('Academic year not found');
    return this.prisma.lateFeeRule.upsert({ where: { academicYearId }, create: { schoolId, academicYearId }, update: {} });
  }

  async updateLateFeeRule(
    schoolId: string,
    academicYearId: string,
    dto: { enabled: boolean; mode: LateFeeMode; amount: number; percentBp: number; frequency: LateFeeFrequency; graceDays: number; maxCap: number | null },
    actorId: string,
  ) {
    const before = await this.lateFeeRule(schoolId, academicYearId);
    if (dto.enabled) {
      if (dto.mode === 'FIXED' && dto.amount <= 0) throw new BadRequestException('Enter the late fee amount');
      if (dto.mode === 'PERCENT' && (dto.percentBp <= 0 || dto.percentBp > 5000)) throw new BadRequestException('Percentage must be between 0.01% and 50%');
    }
    const rule = await this.prisma.lateFeeRule.update({ where: { academicYearId }, data: { ...dto, updatedById: actorId } });
    await this.audit.log({
      schoolId,
      action: 'late_fee_rule.updated',
      entityType: 'LateFeeRule',
      entityId: rule.id,
      summary: `Late fee rule ${rule.enabled ? 'ENABLED' : 'disabled'}: ${describeRule(rule)}`,
      before,
      after: rule,
    });
    return rule;
  }

  /** Show what the rule would charge on a sample invoice, day by day. */
  previewLateFee(dto: { enabled: boolean; mode: LateFeeMode; amount: number; percentBp: number; frequency: LateFeeFrequency; graceDays: number; maxCap: number | null }, principal = rupeesToPaise(40000)) {
    const due = todayIST();
    return [1, 3, 7, 15, 30, 45, 60, 90].map((days) => ({ daysLate: days, amount: computeLateFee({ ...dto, enabled: true }, principal, due, addDays(due, days)).amount }));
  }

  /* ------------------------------ Excel bulk edit ------------------------------ */

  async exportStructures(schoolId: string, academicYearId: string) {
    const data = await this.structures(schoolId, academicYearId);
    const rows: Record<string, unknown>[] = [];
    for (const g of data.grades) {
      for (const it of g.structure?.items ?? []) {
        rows.push({
          grade: g.grade.code,
          gradeName: g.grade.name,
          feeHead: it.feeHead.code,
          feeHeadName: it.feeHead.name,
          frequency: it.frequency,
          amount: it.amount / 100,
          term: it.term?.name ?? '',
          optional: it.isOptional ? 'Y' : 'N',
          appliesTo: it.applicability,
        });
      }
    }
    const header = ['Grade Code', 'Grade', 'Fee Head Code', 'Fee Head', 'Frequency', 'Amount (Rs)', 'Term (annual items only)', 'Optional (Y/N)', 'Applies To'];
    const keys = ['grade', 'gradeName', 'feeHead', 'feeHeadName', 'frequency', 'amount', 'term', 'optional', 'appliesTo'];
    return this.excel.fromTable(
      {
        title: `Fee Structures ${data.academicYear.name}`,
        filters: [['Instructions', 'Edit amounts / add rows, keep the header, then upload. Frequency: ONE_TIME | ANNUAL | PER_TERM. Applies To: ALL | NEW_ADMISSION | EXISTING.']],
        columns: keys.map((k, i) => ({ key: k, header: header[i], kind: k === 'amount' ? 'number' : 'text' })),
        rows,
      },
      'RNSIS Nexus',
    );
  }

  /** Parse & validate an uploaded structure sheet. `apply=false` returns a preview only. */
  async importStructures(schoolId: string, academicYearId: string, buffer: Buffer, mime: string | undefined, apply: boolean) {
    const [year, grades, heads] = await Promise.all([
      this.prisma.academicYear.findFirst({ where: { id: academicYearId, schoolId }, include: { terms: true } }),
      this.prisma.grade.findMany({ where: { schoolId } }),
      this.prisma.feeHead.findMany({ where: { schoolId } }),
    ]);
    if (!year) throw new NotFoundException('Academic year not found');
    // Our export puts a title block above the header; find the header row.
    const { rows: raw } = await this.excel.readRows(buffer, mime);
    let rows = raw;
    if (!raw.length || !('Grade Code' in raw[0])) {
      const ExcelJS = (await import('exceljs')).default;
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer as any);
      const ws = wb.worksheets[0];
      let headerRow = 0;
      ws.eachRow((r, i) => {
        if (!headerRow && r.values && (r.values as any[]).some((v) => String(v).trim() === 'Grade Code')) headerRow = i;
      });
      if (!headerRow) throw new BadRequestException('Could not find the "Grade Code" header row');
      const headers = (ws.getRow(headerRow).values as any[]).map((v) => String(v ?? '').trim());
      rows = [];
      ws.eachRow((r, i) => {
        if (i <= headerRow) return;
        const o: Record<string, string> = { __row: String(i) };
        headers.forEach((h, c) => h && (o[h] = String(r.getCell(c).value ?? '').trim()));
        if (Object.values(o).filter(Boolean).length > 1) rows.push(o);
      });
    }

    const errors: { row: string; error: string }[] = [];
    const byGrade = new Map<string, StructureItemInput[]>();
    for (const r of rows) {
      const grade = grades.find((g) => g.code.toUpperCase() === String(r['Grade Code'] ?? '').toUpperCase());
      const head = heads.find((h) => h.code.toUpperCase() === String(r['Fee Head Code'] ?? '').toUpperCase());
      const frequency = String(r['Frequency'] ?? '').toUpperCase() as FeeFrequency;
      const applicability = (String(r['Applies To'] ?? 'ALL').toUpperCase() || 'ALL') as FeeApplicability;
      let amount: number;
      try {
        amount = rupeesToPaise(r['Amount (Rs)'] ?? '');
      } catch {
        amount = -1;
      }
      const termName = String(r['Term (annual items only)'] ?? '');
      const term = termName ? year.terms.find((t) => t.name.toLowerCase() === termName.toLowerCase()) : undefined;
      const problems = [
        !grade && `Unknown grade code "${r['Grade Code']}"`,
        !head && `Unknown fee head code "${r['Fee Head Code']}"`,
        head?.category === 'LATE_FEE' && 'Late fee cannot be part of a structure',
        !['ONE_TIME', 'ANNUAL', 'PER_TERM'].includes(frequency) && `Invalid frequency "${r['Frequency']}"`,
        !['ALL', 'NEW_ADMISSION', 'EXISTING'].includes(applicability) && `Invalid "Applies To" "${r['Applies To']}"`,
        amount < 0 && `Invalid amount "${r['Amount (Rs)']}"`,
        termName && !term && `Unknown term "${termName}"`,
      ].filter(Boolean) as string[];
      if (problems.length) {
        errors.push({ row: r.__row, error: problems.join('; ') });
        continue;
      }
      const list = byGrade.get(grade!.id) ?? [];
      list.push({ feeHeadId: head!.id, amount, frequency, termId: term?.id ?? null, isOptional: String(r['Optional (Y/N)'] ?? 'N').toUpperCase().startsWith('Y'), applicability });
      byGrade.set(grade!.id, list);
    }
    const preview = [...byGrade.entries()].map(([gradeId, items]) => ({
      grade: grades.find((g) => g.id === gradeId)!.name,
      items: items.length,
      perTermRecurring: items.filter((i) => i.frequency === 'PER_TERM' && !i.isOptional).reduce((a, i) => a + i.amount, 0),
    }));
    if (!apply || errors.length) return { applied: false, errors, preview, rows: rows.length };
    for (const [gradeId, items] of byGrade) await this.upsertStructure(schoolId, { academicYearId, gradeId, items });
    await this.audit.log({ schoolId, action: 'fee_structure.bulk_import', entityType: 'FeeStructure', summary: `Bulk fee structure import for ${year.name}: ${byGrade.size} grades, ${rows.length} rows` });
    return { applied: true, errors, preview, rows: rows.length };
  }
}

export function describeRule(r: { enabled: boolean; mode: LateFeeMode; amount: number; percentBp: number; frequency: LateFeeFrequency; graceDays: number; maxCap: number | null }) {
  const per = { ONCE: 'once', PER_DAY: 'per day', PER_WEEK: 'per week', PER_MONTH: 'per month' }[r.frequency];
  const what = r.mode === 'FIXED' ? formatINR(r.amount) : `${(r.percentBp / 100).toFixed(2).replace(/\.00$/, '')}% of outstanding`;
  return `${what} ${per} after ${r.graceDays} grace day(s)${r.maxCap !== null ? `, capped at ${formatINR(r.maxCap)}` : ''}`;
}
