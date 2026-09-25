import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { dateOnly, toISODate } from '@rnsis/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../core/audit/audit.service';

export interface TermInput {
  name: string;
  startDate: string;
  endDate: string;
  dueDate: string;
  invoiceDate?: string;
  autoGenerateInvoices?: boolean;
}

const shiftYear = (d: Date, years = 1) => {
  const iso = toISODate(d);
  const [y, m, day] = iso.split('-').map(Number);
  // Feb 29 → Feb 28 in non-leap years
  const target = new Date(Date.UTC(y + years, m - 1, day));
  if (target.getUTCMonth() !== m - 1) target.setUTCDate(0);
  return target;
};

@Injectable()
export class AcademicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /* ---------------------------- Academic years ---------------------------- */

  years(schoolId: string) {
    return this.prisma.academicYear.findMany({
      where: { schoolId },
      include: { terms: { orderBy: { sequence: 'asc' } }, lateFeeRule: true, _count: { select: { enrollments: true, sections: true } } },
      orderBy: { startDate: 'desc' },
    });
  }

  async year(schoolId: string, id: string) {
    const y = await this.prisma.academicYear.findFirst({ where: { id, schoolId }, include: { terms: { orderBy: { sequence: 'asc' } }, lateFeeRule: true } });
    if (!y) throw new NotFoundException('Academic year not found');
    return y;
  }

  private validateTerms(start: string, end: string, terms: TermInput[]) {
    if (!terms.length) throw new BadRequestException('At least one term is required');
    let prevEnd = '';
    terms.forEach((t, i) => {
      if (t.startDate > t.endDate) throw new BadRequestException(`${t.name}: start date is after end date`);
      if (t.startDate < start || t.endDate > end) throw new BadRequestException(`${t.name} must fall within the academic year`);
      if (prevEnd && t.startDate <= prevEnd) throw new BadRequestException(`${t.name} overlaps the previous term`);
      prevEnd = t.endDate;
      if (i === 0 && t.startDate !== start) {
        /* allowed: first term may start after year start */
      }
    });
  }

  async createYear(schoolId: string, dto: { name: string; startDate: string; endDate: string; terms: TermInput[] }) {
    if (dto.startDate >= dto.endDate) throw new BadRequestException('Start date must be before end date');
    this.validateTerms(dto.startDate, dto.endDate, dto.terms);
    if (await this.prisma.academicYear.findUnique({ where: { schoolId_name: { schoolId, name: dto.name } } })) throw new ConflictException(`Academic year ${dto.name} already exists`);
    const year = await this.prisma.$transaction(async (tx) => {
      const y = await tx.academicYear.create({ data: { schoolId, name: dto.name, startDate: dateOnly(dto.startDate), endDate: dateOnly(dto.endDate), status: 'PLANNED' } });
      await tx.term.createMany({
        data: dto.terms.map((t, i) => ({
          schoolId,
          academicYearId: y.id,
          name: t.name,
          sequence: i + 1,
          startDate: dateOnly(t.startDate),
          endDate: dateOnly(t.endDate),
          dueDate: dateOnly(t.dueDate),
          invoiceDate: dateOnly(t.invoiceDate ?? t.startDate),
          autoGenerateInvoices: t.autoGenerateInvoices ?? true,
        })),
      });
      await tx.lateFeeRule.create({ data: { schoolId, academicYearId: y.id, enabled: false } });
      return y;
    });
    await this.audit.log({ schoolId, action: 'academic_year.created', entityType: 'AcademicYear', entityId: year.id, summary: `Academic year ${dto.name} created with ${dto.terms.length} terms`, after: dto });
    return this.year(schoolId, year.id);
  }

  async updateYear(schoolId: string, id: string, dto: { name?: string; startDate?: string; endDate?: string }) {
    const before = await this.year(schoolId, id);
    const y = await this.prisma.academicYear.update({
      where: { id },
      data: { name: dto.name, startDate: dto.startDate ? dateOnly(dto.startDate) : undefined, endDate: dto.endDate ? dateOnly(dto.endDate) : undefined },
    });
    await this.audit.log({ schoolId, action: 'academic_year.updated', entityType: 'AcademicYear', entityId: id, summary: `Academic year ${y.name} updated`, before, after: y });
    return y;
  }

  async setCurrent(schoolId: string, id: string) {
    const y = await this.year(schoolId, id);
    if (y.status === 'ARCHIVED') throw new BadRequestException('An archived year cannot be made current');
    await this.prisma.$transaction([
      this.prisma.academicYear.updateMany({ where: { schoolId, isCurrent: true }, data: { isCurrent: false } }),
      this.prisma.academicYear.updateMany({ where: { schoolId, status: 'ACTIVE', NOT: { id } }, data: { status: 'CLOSED' } }),
      this.prisma.academicYear.update({ where: { id }, data: { isCurrent: true, status: 'ACTIVE' } }),
    ]);
    await this.audit.log({ schoolId, action: 'academic_year.set_current', entityType: 'AcademicYear', entityId: id, summary: `${y.name} set as current academic year` });
    return this.year(schoolId, id);
  }

  async archive(schoolId: string, id: string) {
    const y = await this.year(schoolId, id);
    if (y.isCurrent) throw new BadRequestException('The current academic year cannot be archived');
    await this.prisma.academicYear.update({ where: { id }, data: { status: 'ARCHIVED' } });
    await this.audit.log({ schoolId, action: 'academic_year.archived', entityType: 'AcademicYear', entityId: id, summary: `${y.name} archived (read-only; history retained)` });
    return this.year(schoolId, id);
  }

  /** Create the next academic year: terms (+1 year), sections and fee structures copied. */
  async rollForward(schoolId: string, id: string, dto: { name?: string }) {
    const src = await this.year(schoolId, id);
    const startYear = Number(toISODate(src.startDate).slice(0, 4)) + 1;
    const name = dto.name ?? `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
    if (await this.prisma.academicYear.findUnique({ where: { schoolId_name: { schoolId, name } } })) throw new ConflictException(`Academic year ${name} already exists`);
    const created = await this.prisma.$transaction(
      async (tx) => {
        const y = await tx.academicYear.create({ data: { schoolId, name, startDate: shiftYear(src.startDate), endDate: shiftYear(src.endDate), status: 'PLANNED' } });
        const termMap = new Map<string, string>();
        for (const t of src.terms) {
          const nt = await tx.term.create({
            data: {
              schoolId,
              academicYearId: y.id,
              name: t.name,
              sequence: t.sequence,
              startDate: shiftYear(t.startDate),
              endDate: shiftYear(t.endDate),
              dueDate: shiftYear(t.dueDate),
              invoiceDate: shiftYear(t.invoiceDate),
              autoGenerateInvoices: t.autoGenerateInvoices,
            },
          });
          termMap.set(t.id, nt.id);
        }
        const sections = await tx.section.findMany({ where: { academicYearId: id } });
        for (const s of sections) {
          await tx.section.create({ data: { schoolId, academicYearId: y.id, gradeId: s.gradeId, name: s.name, capacity: s.capacity, room: s.room, classTeacherId: s.classTeacherId } });
        }
        const structures = await tx.feeStructure.findMany({ where: { academicYearId: id }, include: { items: true } });
        for (const fs of structures) {
          await tx.feeStructure.create({
            data: {
              schoolId,
              academicYearId: y.id,
              gradeId: fs.gradeId,
              name: fs.name.replace(src.name, name),
              description: fs.description,
              status: 'DRAFT',
              items: {
                create: fs.items.map((it) => ({
                  feeHeadId: it.feeHeadId,
                  amount: it.amount,
                  frequency: it.frequency,
                  termId: it.termId ? termMap.get(it.termId) ?? null : null,
                  isOptional: it.isOptional,
                  applicability: it.applicability,
                  sortOrder: it.sortOrder,
                })),
              },
            },
          });
        }
        const rule = src.lateFeeRule;
        await tx.lateFeeRule.create({
          data: {
            schoolId,
            academicYearId: y.id,
            enabled: false,
            mode: rule?.mode ?? 'FIXED',
            amount: rule?.amount ?? 0,
            percentBp: rule?.percentBp ?? 0,
            frequency: rule?.frequency ?? 'PER_DAY',
            graceDays: rule?.graceDays ?? 0,
            maxCap: rule?.maxCap ?? null,
          },
        });
        return { year: y, sections: sections.length, structures: structures.length };
      },
      { timeout: 60_000 },
    );
    await this.audit.log({
      schoolId,
      action: 'academic_year.rolled_forward',
      entityType: 'AcademicYear',
      entityId: created.year.id,
      summary: `Rolled ${src.name} forward to ${name}: ${src.terms.length} terms, ${created.sections} sections, ${created.structures} fee structures (draft)`,
    });
    return this.year(schoolId, created.year.id);
  }

  async updateTerm(schoolId: string, termId: string, dto: { name?: string; startDate?: string; endDate?: string; invoiceDate?: string; autoGenerateInvoices?: boolean }) {
    const before = await this.prisma.term.findFirst({ where: { id: termId, schoolId } });
    if (!before) throw new NotFoundException('Term not found');
    const t = await this.prisma.term.update({
      where: { id: termId },
      data: {
        name: dto.name,
        startDate: dto.startDate ? dateOnly(dto.startDate) : undefined,
        endDate: dto.endDate ? dateOnly(dto.endDate) : undefined,
        invoiceDate: dto.invoiceDate ? dateOnly(dto.invoiceDate) : undefined,
        autoGenerateInvoices: dto.autoGenerateInvoices,
      },
    });
    await this.audit.log({ schoolId, action: 'term.updated', entityType: 'Term', entityId: termId, summary: `${t.name} updated`, before, after: t });
    return t;
  }

  /* ---------------------------- Grades & sections ---------------------------- */

  grades(schoolId: string) {
    return this.prisma.grade.findMany({ where: { schoolId }, orderBy: { order: 'asc' } });
  }

  async sections(schoolId: string, q: { academicYearId?: string; gradeId?: string }) {
    const yearId = q.academicYearId ?? (await this.prisma.academicYear.findFirst({ where: { schoolId, isCurrent: true } }))?.id;
    const sections = await this.prisma.section.findMany({
      where: { schoolId, academicYearId: yearId, ...(q.gradeId ? { gradeId: q.gradeId } : {}) },
      include: {
        grade: true,
        classTeacher: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { enrollments: { where: { status: 'ACTIVE' } } } },
      },
      orderBy: [{ grade: { order: 'asc' } }, { name: 'asc' }],
    });
    return sections.map((s) => ({ ...s, label: `${s.grade.name} - ${s.name}`, studentCount: s._count.enrollments }));
  }

  async createSection(schoolId: string, dto: { academicYearId: string; gradeId: string; name: string; capacity?: number; room?: string; classTeacherId?: string }) {
    const s = await this.prisma.section.create({ data: { schoolId, ...dto, name: dto.name.toUpperCase() } });
    await this.audit.log({ schoolId, action: 'section.created', entityType: 'Section', entityId: s.id, summary: `Section ${s.name} created`, after: s });
    return s;
  }

  async updateSection(schoolId: string, id: string, dto: { name?: string; capacity?: number; room?: string; classTeacherId?: string | null }) {
    const before = await this.prisma.section.findFirst({ where: { id, schoolId } });
    if (!before) throw new NotFoundException('Section not found');
    const s = await this.prisma.section.update({ where: { id }, data: dto });
    await this.audit.log({ schoolId, action: 'section.updated', entityType: 'Section', entityId: id, summary: `Section ${s.name} updated`, before, after: s });
    return s;
  }

  /** Grade/section options for dropdowns (current year). */
  async classOptions(schoolId: string) {
    const sections = await this.sections(schoolId, {});
    const grades = await this.grades(schoolId);
    return grades.map((g) => ({ id: g.id, name: g.name, code: g.code, order: g.order, sections: sections.filter((s) => s.gradeId === g.id).map((s) => ({ id: s.id, name: s.name, label: s.label, studentCount: s.studentCount, capacity: s.capacity })) }));
  }

  /* ---------------------------- Subjects ---------------------------- */

  subjects(schoolId: string) {
    return this.prisma.subject.findMany({ where: { schoolId }, orderBy: { name: 'asc' } });
  }

  createSubject(schoolId: string, dto: { name: string; code: string; type?: any }) {
    return this.prisma.subject.create({ data: { schoolId, name: dto.name, code: dto.code.toUpperCase(), type: dto.type ?? 'CORE' } });
  }

  updateSubject(schoolId: string, id: string, dto: { name?: string; type?: any }) {
    return this.prisma.subject.update({ where: { id }, data: dto });
  }

  sectionSubjects(sectionId: string) {
    return this.prisma.sectionSubject.findMany({ where: { sectionId }, include: { subject: true, teacher: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { subject: { name: 'asc' } } });
  }

  async setSectionSubjects(schoolId: string, sectionId: string, items: { subjectId: string; teacherId?: string | null; periodsPerWeek?: number }[]) {
    const section = await this.prisma.section.findFirst({ where: { id: sectionId, schoolId } });
    if (!section) throw new NotFoundException('Section not found');
    await this.prisma.$transaction([
      this.prisma.sectionSubject.deleteMany({ where: { sectionId, subjectId: { notIn: items.map((i) => i.subjectId) } } }),
      ...items.map((i) =>
        this.prisma.sectionSubject.upsert({
          where: { sectionId_subjectId: { sectionId, subjectId: i.subjectId } },
          create: { sectionId, subjectId: i.subjectId, teacherId: i.teacherId ?? null, periodsPerWeek: i.periodsPerWeek ?? 5 },
          update: { teacherId: i.teacherId ?? null, periodsPerWeek: i.periodsPerWeek ?? 5 },
        }),
      ),
    ]);
    await this.audit.log({ schoolId, action: 'section.subjects_assigned', entityType: 'Section', entityId: sectionId, summary: `Subject/teacher assignment updated for section ${section.name}`, after: items });
    return this.sectionSubjects(sectionId);
  }
}
