import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { env } from '../../config/env';
import { IS_PUBLIC_KEY } from '../decorators';
import { RequestContext } from '../context/request-context';
import { PrincipalCache } from './principal-cache';

interface AccessClaims {
  sub: string;
  sid: string;
  typ: 'access';
}

/**
 * Global guard: verifies the bearer access token and attaches the principal (role,
 * permissions, data scope). Public routes still get a principal when a valid token is
 * present, so e.g. the pay-link page can recognise a logged-in parent.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly principals: PrincipalCache,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [ctx.getHandler(), ctx.getClass()]);
    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers['authorization'];
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

    if (!token) {
      if (isPublic) return true;
      throw new UnauthorizedException('Authentication required');
    }

    let claims: AccessClaims;
    try {
      claims = await this.jwt.verifyAsync<AccessClaims>(token, { secret: env.JWT_ACCESS_SECRET });
    } catch {
      if (isPublic) return true;
      throw new UnauthorizedException('Session expired — please sign in again');
    }
    if (claims.typ !== 'access') throw new UnauthorizedException('Invalid token');

    const principal = await this.principals.get(claims.sub);
    if (!principal) {
      if (isPublic) return true;
      throw new UnauthorizedException('Account is disabled');
    }
    req.user = principal;
    RequestContext.set({ userId: principal.id, userName: principal.name, schoolId: principal.schoolId });
    return true;
  }
}
