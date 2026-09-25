import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { env } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';

interface StorageDriver {
  put(key: string, body: Buffer, mime: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

class LocalDriver implements StorageDriver {
  constructor(private readonly root: string) {}
  private full(key: string) {
    const p = path.resolve(this.root, key);
    if (!p.startsWith(path.resolve(this.root))) throw new Error('Invalid storage key');
    return p;
  }
  async put(key: string, body: Buffer) {
    const p = this.full(key);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, body);
  }
  async get(key: string) {
    try {
      return await fs.readFile(this.full(key));
    } catch {
      throw new NotFoundException('File not found in storage');
    }
  }
  async delete(key: string) {
    await fs.rm(this.full(key), { force: true });
  }
}

class S3Driver implements StorageDriver {
  private client = new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    credentials: env.S3_ACCESS_KEY && env.S3_SECRET_KEY ? { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY } : undefined,
  });
  async put(key: string, body: Buffer, mime: string) {
    await this.client.send(new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: key, Body: body, ContentType: mime, ServerSideEncryption: 'AES256' }));
  }
  async get(key: string) {
    const res = await this.client.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes) throw new NotFoundException('File not found in storage');
    return Buffer.from(bytes);
  }
  async delete(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
  }
}

export interface SaveFileInput {
  schoolId: string;
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  purpose: string;
  uploadedById?: string | null;
  isTemporary?: boolean;
  uploadToken?: string | null;
}

/** S3-compatible (MinIO/AWS) or local-disk file storage with a StoredFile catalogue row. */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly driver: StorageDriver = env.STORAGE_DRIVER === 's3' ? new S3Driver() : new LocalDriver(env.STORAGE_LOCAL_DIR);

  constructor(private readonly prisma: PrismaService) {}

  async save(input: SaveFileInput) {
    const ext = path.extname(input.originalName).toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 8);
    const now = new Date();
    const key = `${input.schoolId}/${input.purpose}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}${ext}`;
    await this.driver.put(key, input.buffer, input.mimeType);
    return this.prisma.storedFile.create({
      data: {
        schoolId: input.schoolId,
        storageKey: key,
        originalName: input.originalName.slice(0, 200),
        mimeType: input.mimeType,
        size: input.buffer.length,
        checksum: createHash('sha256').update(input.buffer).digest('hex'),
        purpose: input.purpose,
        uploadedById: input.uploadedById ?? null,
        isTemporary: input.isTemporary ?? false,
        uploadToken: input.uploadToken ?? null,
      },
    });
  }

  async read(fileId: string) {
    const file = await this.prisma.storedFile.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');
    const buffer = await this.driver.get(file.storageKey);
    return { file, buffer };
  }

  async readKey(key: string) {
    return this.driver.get(key);
  }

  async putKey(key: string, buffer: Buffer, mime: string) {
    await this.driver.put(key, buffer, mime);
  }

  async remove(fileId: string) {
    const file = await this.prisma.storedFile.findUnique({ where: { id: fileId } });
    if (!file) return;
    await this.driver.delete(file.storageKey).catch((e) => this.logger.warn(`Delete failed ${file.storageKey}: ${e.message}`));
    await this.prisma.storedFile.delete({ where: { id: fileId } });
  }

  /** Attach temporary public uploads to a record so the orphan sweeper keeps them. */
  async claim(fileIds: string[], schoolId: string) {
    if (!fileIds.length) return;
    await this.prisma.storedFile.updateMany({ where: { id: { in: fileIds }, schoolId }, data: { isTemporary: false, uploadToken: null } });
  }

  /** Delete unclaimed public uploads older than 24h (runs nightly). */
  async sweepTemporary() {
    const cutoff = new Date(Date.now() - 24 * 3600 * 1000);
    const stale = await this.prisma.storedFile.findMany({ where: { isTemporary: true, createdAt: { lt: cutoff } }, take: 500 });
    for (const f of stale) await this.remove(f.id);
    return stale.length;
  }
}
