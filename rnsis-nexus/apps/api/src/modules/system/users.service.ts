import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DashboardKind, DataScope, UserStatus } from '@prisma/client';
import { ALL_PERMISSIONS, DEFAULT_ROLES } from '@rnsis/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../core/audit/audit.service';
import { PrincipalCache } from '../../common/guards/principal-cache';
import { generatePassword } from '../../common/utils/crypto';
import { AuthService } from '../auth/auth.service';
import { NotificationsService } from '../notifications/notifications.service';
import { env } from '../../config/env';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly principals: PrincipalCache,
    private readonly notifications: NotificationsService,
  ) {}

  /* ------------------------------ Roles ------------------------------ */

  async roles(schoolId: string) {
    const roles = await this.prisma.role.findMany({
      where: { schoolId },
      include: { permissions: true, _count: { select: { users: true } } },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
    return roles.map((r) => ({ ...r, permissions: r.permissions.map((p) => p.permission), userCount: r._count.users }));
  }

  async setRolePermissions(schoolId: string, roleId: string, permissions: string[]) {
    const role = await this.prisma.role.findFirst({ where: { id: roleId, schoolId }, include: { permissions: true } });
    if (!role) throw new NotFoundException('Role not found');
    const unknown = permissions.filter((p) => !ALL_PERMISSIONS.includes(p));
    if (unknown.length) throw new BadRequestException(`Unknown permissions: ${unknown.join(', ')}`);
    if (role.key === 'SUPER_ADMIN' && !permissions.includes('settings.roles')) {
      throw new BadRequestException('Super Admin must keep "Configure roles" so the school can never lock itself out.');
    }
    const before = role.permissions.map((p) => p.permission).sort();
    const after = [...new Set(permissions)].sort();
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({ data: after.map((permission) => ({ roleId, permission })) }),
    ]);
    const added = after.filter((p) => !before.includes(p));
    const removed = before.filter((p) => !after.includes(p));
    await this.audit.log({
      schoolId,
      action: 'rbac.role_permissions_changed',
      entityType: 'Role',
      entityId: roleId,
      summary: `Permissions for ${role.name} changed (+${added.length} / -${removed.length})`,
      before,
      after,
      meta: { added, removed },
    });
    this.principals.invalidateAll();
    return { permissions: after };
  }

  async resetRole(schoolId: string, roleId: string) {
    const role = await this.prisma.role.findFirst({ where: { id: roleId, schoolId } });
    if (!role) throw new NotFoundException('Role not found');
    const def = DEFAULT_ROLES.find((d) => d.key === role.key);
    if (!def) throw new BadRequestException('Only system roles have defaults to restore');
    return this.setRolePermissions(schoolId, roleId, def.permissions);
  }

  async createRole(schoolId: string, dto: { name: string; description?: string; dashboard: DashboardKind; dataScope: DataScope; copyFromRoleId?: string }) {
    const key = dto.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
    if (await this.prisma.role.findUnique({ where: { schoolId_key: { schoolId, key } } })) throw new ConflictException('A role with this name already exists');
    const perms = dto.copyFromRoleId ? (await this.prisma.rolePermission.findMany({ where: { roleId: dto.copyFromRoleId } })).map((p) => p.permission) : ['dashboard.view'];
    const role = await this.prisma.role.create({
      data: { schoolId, key, name: dto.name, description: dto.description, dashboard: dto.dashboard, dataScope: dto.dataScope, permissions: { create: perms.map((permission) => ({ permission })) } },
    });
    await this.audit.log({ schoolId, action: 'rbac.role_created', entityType: 'Role', entityId: role.id, summary: `Role ${role.name} created`, after: { ...role, permissions: perms } });
    return role;
  }

  async updateRole(schoolId: string, roleId: string, dto: { name?: string; description?: string; dashboard?: DashboardKind; dataScope?: DataScope }) {
    const before = await this.prisma.role.findFirst({ where: { id: roleId, schoolId } });
    if (!before) throw new NotFoundException('Role not found');
    const role = await this.prisma.role.update({ where: { id: roleId }, data: dto });
    await this.audit.log({ schoolId, action: 'rbac.role_updated', entityType: 'Role', entityId: roleId, summary: `Role ${role.name} updated`, before, after: role });
    this.principals.invalidateAll();
    return role;
  }

  /* ------------------------------ Users ------------------------------ */

  async list(schoolId: string, q: { roleId?: string; q?: string; status?: UserStatus; skip: number; take: number }) {
    const where: any = {
      schoolId,
      ...(q.roleId ? { roleId: q.roleId } : {}),
      ...(q.status ? { status: q.status } : {}),
      ...(q.q
        ? { OR: [{ name: { contains: q.q, mode: 'insensitive' } }, { username: { contains: q.q, mode: 'insensitive' } }, { email: { contains: q.q, mode: 'insensitive' } }, { phone: { contains: q.q } }] }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: { id: true, name: true, username: true, email: true, phone: true, status: true, lastLoginAt: true, createdAt: true, mustChangePassword: true, role: { select: { id: true, name: true, key: true } } },
        orderBy: { name: 'asc' },
        skip: q.skip,
        take: q.take,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total };
  }

  async create(schoolId: string, dto: { name: string; username: string; email?: string; phone?: string; roleId: string; password?: string; staffId?: string }) {
    const role = await this.prisma.role.findFirst({ where: { id: dto.roleId, schoolId } });
    if (!role) throw new BadRequestException('Invalid role');
    const password = dto.password || generatePassword();
    const user = await this.prisma.user.create({
      data: {
        schoolId,
        roleId: role.id,
        name: dto.name,
        username: dto.username.toLowerCase(),
        email: dto.email?.toLowerCase(),
        phone: dto.phone,
        passwordHash: await AuthService.hash(password),
        mustChangePassword: true,
      },
    });
    if (dto.staffId) await this.prisma.staff.update({ where: { id: dto.staffId }, data: { userId: user.id } });
    await this.audit.log({ schoolId, action: 'user.created', entityType: 'User', entityId: user.id, summary: `User ${user.username} (${role.name}) created` });
    await this.notifications.notify({
      schoolId,
      templateKey: 'APPLICANT_ACCOUNT',
      channels: ['EMAIL', 'SMS'],
      to: { name: user.name, email: user.email, phone: user.phone, userId: user.id },
      data: { parent_name: user.name, username: user.username, password, portal_url: `${env.APP_URL}/login`, application_no: '-' },
    });
    return { id: user.id, username: user.username, temporaryPassword: dto.password ? undefined : password };
  }

  async update(schoolId: string, userId: string, dto: { name?: string; email?: string; phone?: string; roleId?: string; status?: UserStatus }, actorId: string) {
    const before = await this.prisma.user.findFirst({ where: { id: userId, schoolId }, include: { role: true } });
    if (!before) throw new NotFoundException('User not found');
    if (userId === actorId && (dto.status === 'DISABLED' || (dto.roleId && dto.roleId !== before.roleId))) {
      throw new BadRequestException('You cannot disable yourself or change your own role.');
    }
    const user = await this.prisma.user.update({ where: { id: userId }, data: { ...dto, ...(dto.status === 'ACTIVE' ? { failedLoginCount: 0, lockedUntil: null } : {}) } });
    if (dto.status === 'DISABLED') await this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await this.audit.log({
      schoolId,
      action: 'user.updated',
      entityType: 'User',
      entityId: userId,
      summary: `User ${user.username} updated`,
      before: { name: before.name, email: before.email, phone: before.phone, roleId: before.roleId, status: before.status },
      after: { name: user.name, email: user.email, phone: user.phone, roleId: user.roleId, status: user.status },
    });
    this.principals.invalidateUser(userId);
    return user;
  }

  async resetPassword(schoolId: string, userId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, schoolId } });
    if (!user) throw new NotFoundException('User not found');
    const password = generatePassword();
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await AuthService.hash(password), mustChangePassword: true, failedLoginCount: 0, lockedUntil: null } });
    await this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await this.audit.log({ schoolId, action: 'user.password_reset_by_admin', entityType: 'User', entityId: userId, summary: `Temporary password issued for ${user.username}` });
    await this.notifications.notify({
      schoolId,
      templateKey: 'APPLICANT_ACCOUNT',
      channels: ['EMAIL', 'SMS'],
      to: { name: user.name, email: user.email, phone: user.phone, userId },
      data: { parent_name: user.name, username: user.username, password, portal_url: `${env.APP_URL}/login`, application_no: '-' },
    });
    return { temporaryPassword: password };
  }
}
