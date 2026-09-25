import { Body, Controller, Delete, Get, HttpCode, Param, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { env } from '../../config/env';
import { CurrentUser, Public } from '../../common/decorators';
import type { CurrentUserData } from '../../common/context/auth-user';
import { AuthService, IssuedTokens } from './auth.service';
import { ChangePasswordDto, ForgotPasswordDto, LoginDto, ResetPasswordDto } from './dto/auth.dto';

export const REFRESH_COOKIE = 'rnsis_rt';

/**
 * Refresh tokens live in an httpOnly, SameSite=Strict cookie scoped to /api/auth; the short
 * lived access token is returned in the body and sent as a Bearer header. Cookie-bearing
 * endpoints additionally require the X-Requested-With header (CSRF defence in depth).
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private setCookie(res: Response, t: IssuedTokens) {
    res.cookie(REFRESH_COOKIE, t.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
      expires: t.refreshExpiresAt,
    });
  }

  private requireCsrfHeader(req: Request) {
    if ((req.headers['x-requested-with'] as string | undefined)?.toLowerCase() !== 'rnsis') throw new UnauthorizedException('Missing request header');
  }

  private meta(req: Request) {
    return { ip: req.ip, userAgent: req.headers['user-agent'] as string | undefined };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { tokens, user } = await this.auth.login(dto.username, dto.password, this.meta(req));
    this.setCookie(res, tokens);
    return { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn, user };
  }

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.requireCsrfHeader(req);
    const { tokens, user } = await this.auth.refresh(req.cookies?.[REFRESH_COOKIE], this.meta(req));
    this.setCookie(res, tokens);
    return { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn, user };
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.requireCsrfHeader(req);
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: CurrentUserData) {
    return this.auth.me(user.id);
  }

  @ApiBearerAuth()
  @Post('change-password')
  @HttpCode(204)
  async changePassword(@CurrentUser() user: CurrentUserData, @Body() dto: ChangePasswordDto, @Req() req: Request) {
    const family = await this.auth.familyOf(req.cookies?.[REFRESH_COOKIE]);
    await this.auth.changePassword(user.id, dto.currentPassword, dto.newPassword, family);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(202)
  async forgot(@Body() dto: ForgotPasswordDto) {
    await this.auth.forgotPassword(dto.username);
    return { message: 'If an account exists, a reset link has been sent to the registered email / mobile.' };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('reset-password')
  @HttpCode(204)
  async reset(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto.token, dto.newPassword);
  }

  @ApiBearerAuth()
  @Get('sessions')
  sessions(@CurrentUser() user: CurrentUserData) {
    return this.auth.sessions(user.id);
  }

  @ApiBearerAuth()
  @Delete('sessions/:id')
  @HttpCode(204)
  async revoke(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    await this.auth.revokeSession(user.id, id);
  }
}
