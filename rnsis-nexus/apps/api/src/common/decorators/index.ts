import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { CurrentUserData } from '../context/auth-user';

export const IS_PUBLIC_KEY = 'isPublic';
export const PERMISSIONS_KEY = 'permissions';
export const ANY_PERMISSIONS_KEY = 'anyPermissions';

/** Route is reachable without a token (public forms, webhooks, pay links). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Caller must hold every listed permission. */
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

/** Caller must hold at least one of the listed permissions. */
export const RequireAnyPermission = (...permissions: string[]) => SetMetadata(ANY_PERMISSIONS_KEY, permissions);

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): CurrentUserData => {
  return ctx.switchToHttp().getRequest().user;
});

export const SchoolId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest();
  return req.user?.schoolId ?? req.schoolId;
});

export const ClientIp = createParamDecorator((_data: unknown, ctx: ExecutionContext): string | undefined => {
  const req = ctx.switchToHttp().getRequest();
  return req.ip;
});
