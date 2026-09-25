import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import type { AuthUser } from '@rnsis/shared';
import { env } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../core/audit/audit.service';
import { SchoolService } from '../../core/settings/school.service';
import { PrincipalCache } from '../../common/guards/principal-cache';
import { randomToken, sha256 } from '../../common/utils/crypto';
import { NotificationsService } from '../notifications/notifications.service';

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
export const BCRYPT_ROUNDS = 11;

export interface IssuedTokens {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresAt: Date;
}

@Injectable()
export class AuthService {
  private static dummyHash?: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
    private readonly schools: SchoolService,
    private readonly principals: PrincipalCache,
    private readonly notifications: NotificationsService,
  ) {}

  static hash(password: string) {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  private async findLoginUser(schoolId: string, login: string) {
    const value = login.trim();
    const digits = value.replace(/\D/g, '');
    const phoneCandidates = digits.length >= 10 ? [digits.slice(-10), `+91${digits.slice(-10)}`, `91${digits.slice(-10)}`] : [];
    return this.prisma.user.findFirst({
      where: {
        schoolId,
        OR: [
          { username: { equals: value, mode: 'insensitive' } },
          { email: { equals: value, mode: 'insensitive' } },
          ...(phoneCandidates.length ? [{ phone: { in: phoneCandidates } }] : []),
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async login(username: string, password: string, meta: { ip?: string; userAgent?: string }) {
    const school = await this.schools.resolvePublicSchool();
    const user = await this.findLoginUser(school.id, username);
    const invalid = new UnauthorizedException('Invalid username or password');
    if (!user) {
      // Constant-time-ish: spend the same bcrypt work whether or not the account exists.
      AuthService.dummyHash ??= await bcrypt.hash('timing-parity-placeholder', BCRYPT_ROUNDS);
      await bcrypt.compare(password, AuthService.dummyHash);
      throw invalid;
    }
    if (user.status === 'DISABLED') throw new ForbiddenException('This account has been disabled. Contact the school office.');
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException(`Too many failed attempts. Try again after ${Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)} minute(s).`);
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      const failed = user.failedLoginCount + 1;
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: failed, lockedUntil: failed >= MAX_FAILED ? new Date(Date.now() + LOCK_MINUTES * 60000) : null },
      });
      await this.audit.log({ schoolId: user.schoolId, userId: user.id, action: 'auth.login_failed', entityType: 'User', entityId: user.id, summary: `Failed login for ${user.username}`, meta: { failed } });
      throw invalid;
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date(), status: 'ACTIVE' } });
    await this.audit.log({ schoolId: user.schoolId, userId: user.id, action: 'auth.login', entityType: 'User', entityId: user.id, summary: `${user.name} signed in` });
    const tokens = await this.issue(user, randomUUID(), meta);
    return { tokens, user: await this.me(user.id) };
  }

  async issue(user: Pick<User, 'id' | 'schoolId'>, familyId: string, meta: { ip?: string; userAgent?: string }): Promise<IssuedTokens> {
    const accessToken = await this.jwt.signAsync({ sub: user.id, sid: user.schoolId, typ: 'access' }, { secret: env.JWT_ACCESS_SECRET, expiresIn: env.JWT_ACCESS_TTL_SECONDS });
    const refreshToken = randomToken(48);
    const refreshExpiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 86400_000);
    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: sha256(refreshToken), familyId, expiresAt: refreshExpiresAt, ip: meta.ip, userAgent: meta.userAgent?.slice(0, 300) },
    });
    return { accessToken, expiresIn: env.JWT_ACCESS_TTL_SECONDS, refreshToken, refreshExpiresAt };
  }

  /** Rotate a refresh token. Presenting an already-rotated token revokes the whole family. */
  async refresh(refreshToken: string | undefined, meta: { ip?: string; userAgent?: string }) {
    if (!refreshToken) throw new UnauthorizedException('No session');
    const row = await this.prisma.refreshToken.findUnique({ where: { tokenHash: sha256(refreshToken) }, include: { user: true } });
    if (!row) throw new UnauthorizedException('Session not found');
    if (row.revokedAt) {
      await this.prisma.refreshToken.updateMany({ where: { familyId: row.familyId, revokedAt: null }, data: { revokedAt: new Date() } });
      await this.audit.log({ schoolId: row.user.schoolId, userId: row.userId, action: 'auth.refresh_reuse_detected', entityType: 'User', entityId: row.userId, summary: 'Refresh token reuse detected — all sessions in family revoked', meta });
      throw new UnauthorizedException('Session revoked. Please sign in again.');
    }
    if (row.expiresAt < new Date()) throw new UnauthorizedException('Session expired');
    if (row.user.status !== 'ACTIVE') throw new UnauthorizedException('Account disabled');
    const tokens = await this.issue(row.user, row.familyId, meta);
    const newRow = await this.prisma.refreshToken.findUnique({ where: { tokenHash: sha256(tokens.refreshToken) } });
    await this.prisma.refreshToken.update({ where: { id: row.id }, data: { revokedAt: new Date(), replacedById: newRow?.id } });
    return { tokens, user: await this.me(row.userId) };
  }

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) return;
    const row = await this.prisma.refreshToken.findUnique({ where: { tokenHash: sha256(refreshToken) } });
    if (row) await this.prisma.refreshToken.updateMany({ where: { familyId: row.familyId, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  async me(userId: string): Promise<AuthUser> {
    const u = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { role: { include: { permissions: true } }, staff: { select: { id: true } }, guardian: { select: { id: true } } },
    });
    return {
      id: u.id,
      schoolId: u.schoolId,
      name: u.name,
      username: u.username,
      email: u.email,
      phone: u.phone,
      role: { id: u.role.id, key: u.role.key, name: u.role.name, dashboard: u.role.dashboard, dataScope: u.role.dataScope },
      permissions: u.role.permissions.map((p) => p.permission).sort(),
      mustChangePassword: u.mustChangePassword,
      preferredLanguage: u.preferredLanguage,
      staffId: u.staff?.id ?? null,
      guardianId: u.guardian?.id ?? null,
    };
  }

  async changePassword(userId: string, current: string, next: string, keepFamily?: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await bcrypt.compare(current, user.passwordHash))) throw new BadRequestException('Current password is incorrect');
    if (current === next) throw new BadRequestException('New password must be different from the current one');
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await AuthService.hash(next), mustChangePassword: false, passwordChangedAt: new Date() } });
    await this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null, ...(keepFamily ? { NOT: { familyId: keepFamily } } : {}) }, data: { revokedAt: new Date() } });
    await this.audit.log({ schoolId: user.schoolId, userId, action: 'auth.password_changed', entityType: 'User', entityId: userId, summary: `${user.name} changed password; other sessions signed out` });
    this.principals.invalidateUser(userId);
  }

  async forgotPassword(login: string) {
    const school = await this.schools.resolvePublicSchool();
    const user = await this.findLoginUser(school.id, login);
    if (!user || user.status !== 'ACTIVE') return; // never reveal whether an account exists
    const token = randomToken(32);
    await this.prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 30 * 60_000) } });
    await this.notifications.notify({
      schoolId: user.schoolId,
      templateKey: 'PASSWORD_RESET',
      channels: ['EMAIL', 'SMS'],
      to: { name: user.name, email: user.email, phone: user.phone, userId: user.id },
      data: { name: user.name, reset_url: `${env.APP_URL}/reset-password?token=${token}` },
    });
    await this.audit.log({ schoolId: user.schoolId, userId: user.id, action: 'auth.password_reset_requested', entityType: 'User', entityId: user.id, summary: `Password reset requested for ${user.username}` });
  }

  async resetPassword(token: string, newPassword: string) {
    const row = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) }, include: { user: true } });
    if (!row || row.usedAt || row.expiresAt < new Date()) throw new BadRequestException('This reset link is invalid or has expired.');
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: row.userId }, data: { passwordHash: await AuthService.hash(newPassword), mustChangePassword: false, failedLoginCount: 0, lockedUntil: null, passwordChangedAt: new Date() } }),
      this.prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
      this.prisma.refreshToken.updateMany({ where: { userId: row.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    await this.audit.log({ schoolId: row.user.schoolId, userId: row.userId, action: 'auth.password_reset', entityType: 'User', entityId: row.userId, summary: `Password reset via link for ${row.user.username}` });
    this.principals.invalidateUser(row.userId);
  }

  async sessions(userId: string) {
    const rows = await this.prisma.refreshToken.findMany({ where: { userId, revokedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } });
    return rows.map((r) => ({ id: r.id, familyId: r.familyId, createdAt: r.createdAt, expiresAt: r.expiresAt, ip: r.ip, userAgent: r.userAgent }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const row = await this.prisma.refreshToken.findFirst({ where: { id: sessionId, userId } });
    if (row) await this.prisma.refreshToken.updateMany({ where: { familyId: row.familyId, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  familyOf(refreshToken: string | undefined) {
    if (!refreshToken) return Promise.resolve(undefined);
    return this.prisma.refreshToken.findUnique({ where: { tokenHash: sha256(refreshToken) } }).then((r) => r?.familyId);
  }
}
