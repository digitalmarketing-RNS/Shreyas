import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ANY_PERMISSIONS_KEY, IS_PUBLIC_KEY, PERMISSIONS_KEY } from '../decorators';
import type { CurrentUserData } from '../context/auth-user';

/** Global RBAC guard enforcing @RequirePermissions / @RequireAnyPermission on every route. */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const targets = [ctx.getHandler(), ctx.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets);
    const all = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, targets) ?? [];
    const any = this.reflector.getAllAndOverride<string[]>(ANY_PERMISSIONS_KEY, targets) ?? [];
    if (isPublic && !all.length && !any.length) return true;

    const user: CurrentUserData | undefined = ctx.switchToHttp().getRequest().user;
    if (!user) return isPublic;
    const granted = new Set(user.permissions);
    const missing = all.filter((p) => !granted.has(p));
    if (missing.length) throw new ForbiddenException(`You do not have permission: ${missing.join(', ')}`);
    if (any.length && !any.some((p) => granted.has(p))) throw new ForbiddenException(`Requires one of: ${any.join(', ')}`);
    return true;
  }
}
