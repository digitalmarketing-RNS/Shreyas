import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CurrentUserData } from '../common/context/auth-user';

/**
 * Row-level data scoping on top of RBAC permissions:
 *  - ALL          → whole school
 *  - OWN_CLASSES  → teachers: sections they class-teach or teach a subject in (current year)
 *  - OWN_CHILDREN → parents: students linked to their guardian record
 */
@Injectable()
export class ScopeService {
  constructor(private readonly prisma: PrismaService) {}

  async teacherSectionIds(user: CurrentUserData): Promise<string[]> {
    if (!user.staffId) return [];
    const year = await this.prisma.academicYear.findFirst({ where: { schoolId: user.schoolId, isCurrent: true }, select: { id: true } });
    const [classTeacher, subjects] = await Promise.all([
      this.prisma.section.findMany({ where: { classTeacherId: user.staffId, ...(year ? { academicYearId: year.id } : {}) }, select: { id: true } }),
      this.prisma.sectionSubject.findMany({ where: { teacherId: user.staffId, ...(year ? { section: { academicYearId: year.id } } : {}) }, select: { sectionId: true } }),
    ]);
    return [...new Set([...classTeacher.map((s) => s.id), ...subjects.map((s) => s.sectionId)])];
  }

  async parentStudentIds(user: CurrentUserData): Promise<string[]> {
    if (!user.guardianId) return [];
    const links = await this.prisma.studentGuardian.findMany({ where: { guardianId: user.guardianId }, select: { studentId: true } });
    return links.map((l) => l.studentId);
  }

  /** Prisma `where` fragment restricting Student queries to what the user may see. */
  async studentWhere(user: CurrentUserData): Promise<Prisma.StudentWhereInput> {
    if (user.dataScope === 'ALL') return { schoolId: user.schoolId };
    if (user.dataScope === 'OWN_CHILDREN') return { schoolId: user.schoolId, id: { in: await this.parentStudentIds(user) } };
    const sections = await this.teacherSectionIds(user);
    return { schoolId: user.schoolId, enrollments: { some: { sectionId: { in: sections }, status: 'ACTIVE' } } };
  }

  async canAccessStudent(user: CurrentUserData, studentId: string): Promise<boolean> {
    const where = await this.studentWhere(user);
    return (await this.prisma.student.count({ where: { AND: [where, { id: studentId }] } })) > 0;
  }

  async assertStudentAccess(user: CurrentUserData, studentId: string) {
    if (!(await this.canAccessStudent(user, studentId))) throw new ForbiddenException('You do not have access to this student');
  }

  async assertSectionAccess(user: CurrentUserData, sectionId: string) {
    if (user.dataScope === 'ALL') return;
    if (user.dataScope === 'OWN_CLASSES' && (await this.teacherSectionIds(user)).includes(sectionId)) return;
    throw new ForbiddenException('You do not have access to this class');
  }
}
