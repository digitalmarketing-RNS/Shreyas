import { BadRequestException, Controller, ForbiddenException, Get, Param, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { env } from '../../config/env';
import { CurrentUser, Public } from '../../common/decorators';
import type { CurrentUserData } from '../../common/context/auth-user';
import { randomToken, signPayload, verifyPayload } from '../../common/utils/crypto';
import { SchoolService } from '../../core/settings/school.service';
import { StorageService } from '../../core/storage/storage.service';

export const ALLOWED_UPLOAD_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_STAFF_TYPES = [...ALLOWED_UPLOAD_TYPES, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'application/vnd.ms-excel'];

export function signedFileUrl(fileId: string, ttlSeconds = 7 * 86400): string {
  return `${env.API_URL}/api/files/signed/${signPayload({ f: fileId }, env.PAY_LINK_SECRET, ttlSeconds)}`;
}

function sniffOk(buf: Buffer, mime: string) {
  if (mime === 'application/pdf') return buf.subarray(0, 4).toString() === '%PDF';
  if (mime === 'image/png') return buf[0] === 0x89 && buf[1] === 0x50;
  if (mime === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8;
  if (mime === 'image/webp') return buf.subarray(8, 12).toString() === 'WEBP';
  return true;
}

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(
    private readonly storage: StorageService,
    private readonly schools: SchoolService,
  ) {}

  /** Staff upload (documents, logos, imports). */
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024 } }))
  async upload(@CurrentUser() user: CurrentUserData, @UploadedFile() file: Express.Multer.File, @Query('purpose') purpose = 'general') {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!ALLOWED_STAFF_TYPES.includes(file.mimetype)) throw new BadRequestException('Unsupported file type');
    if (!sniffOk(file.buffer, file.mimetype)) throw new BadRequestException('File content does not match its type');
    const saved = await this.storage.save({
      schoolId: user.schoolId,
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      purpose: purpose.replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'general',
      uploadedById: user.id,
    });
    return { id: saved.id, name: saved.originalName, size: saved.size, mimeType: saved.mimeType };
  }

  /**
   * Public upload for the online application form. Files stay "temporary" until the
   * application is submitted (claimed) and are swept after 24h otherwise.
   */
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiConsumes('multipart/form-data')
  @Post('public-upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } }))
  async publicUpload(@UploadedFile() file: Express.Multer.File, @Query('kind') kind = 'application-document') {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!ALLOWED_UPLOAD_TYPES.includes(file.mimetype)) throw new BadRequestException('Only PDF, JPG, PNG or WEBP files are accepted');
    if (!sniffOk(file.buffer, file.mimetype)) throw new BadRequestException('File content does not match its type');
    const school = await this.schools.resolvePublicSchool();
    const token = randomToken(24);
    const saved = await this.storage.save({
      schoolId: school.id,
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      purpose: kind === 'photo' ? 'application-photo' : 'application-document',
      isTemporary: true,
      uploadToken: token,
    });
    return { id: saved.id, token, name: saved.originalName, size: saved.size, mimeType: saved.mimeType };
  }

  /** Short-lived signed link (emailed receipts, offer letters, WhatsApp links). */
  @Public()
  @Get('signed/:token')
  async signed(@Param('token') token: string, @Res() res: Response) {
    const data = verifyPayload<{ f: string }>(token, env.PAY_LINK_SECRET);
    if (!data) throw new ForbiddenException('This link has expired');
    const { file, buffer } = await this.storage.read(data.f);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.send(buffer);
  }

  /** Staff-only direct access. Parents receive documents through scoped portal endpoints. */
  @ApiBearerAuth()
  @Get(':id')
  async get(@CurrentUser() user: CurrentUserData, @Param('id') id: string, @Query('download') download: string, @Res() res: Response) {
    if (user.dataScope === 'OWN_CHILDREN') throw new ForbiddenException('Use the parent portal to download documents');
    const { file, buffer } = await this.storage.read(id);
    if (file.schoolId !== user.schoolId) throw new ForbiddenException();
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${encodeURIComponent(file.originalName)}"`);
    res.send(buffer);
  }
}
