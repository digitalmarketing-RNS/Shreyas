import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUserData } from '../context/auth-user';

/**
 * Loads a user's role, permissions and links once and caches them briefly so the RBAC
 * guard does not hit the database on every request. Role edits call `invalidateRole`.
 */
@Injectable()
export class PrincipalCache {
  private readonly ttlMs = 30_000;
  private cache = new Map<string, { at: number; value: CurrentUserData | null }>();

  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string): Promise<CurrentUserData | null> {
    const hit = this.cache.get(userId);
    if (hit && Date.now() - hit.at < this.ttlMs) return hit.value;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: { include: { permissions: true } }, staff: { select: { id: true } }, guardian: { select: { id: true } } },
    });
    const value: CurrentUserData | null =
      user && user.status === 'ACTIVE'
        ? {
            id: user.id,
            schoolId: user.schoolId,
            name: user.name,
            username: user.username,
            roleId: user.roleId,
            roleKey: user.role.key,
            dashboard: user.role.dashboard,
            dataScope: user.role.dataScope,
            permissions: user.role.permissions.map((p) => p.permission),
            staffId: user.staff?.id ?? null,
            guardianId: user.guardian?.id ?? null,
          }
        : null;
    this.cache.set(userId, { at: Date.now(), value });
    if (this.cache.size > 5000) this.cache.clear();
    return value;
  }

  invalidateUser(userId: string) {
    this.cache.delete(userId);
  }

  invalidateAll() {
    this.cache.clear();
  }
}
