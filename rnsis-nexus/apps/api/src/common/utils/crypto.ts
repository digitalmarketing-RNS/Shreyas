import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { env } from '../../config/env';

function keyBytes(): Buffer {
  const raw = env.FIELD_ENCRYPTION_KEY;
  const buf = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (buf.length !== 32) {
    // Derive a 32-byte key from whatever was provided (never used in production: env validation warns).
    return createHash('sha256').update(raw).digest();
  }
  return buf;
}

const KEY = keyBytes();

/** AES-256-GCM encrypt a sensitive field. Output: v1.<iv>.<tag>.<ciphertext> (base64url). */
export function encryptField(plain: string | null | undefined): string | null {
  if (plain === null || plain === undefined || plain === '') return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', KEY, iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), ct.toString('base64url')].join('.');
}

export function decryptField(enc: string | null | undefined): string | null {
  if (!enc) return null;
  const [v, iv, tag, ct] = enc.split('.');
  if (v !== 'v1' || !iv || !tag || !ct) return null;
  try {
    const decipher = createDecipheriv('aes-256-gcm', KEY, Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(ct, 'base64url')), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function hmac(secret: string, value: string): string {
  return createHmac('sha256', secret).update(value).digest('hex');
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Human-friendly temporary password: 10 chars, no ambiguous characters. */
export function generatePassword(length = 10): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  // guarantee at least one digit
  return out.slice(0, -1) + String(2 + (bytes[0] % 8));
}

/** Short-lived signed token for public links (pay links, file downloads). */
export function signPayload(payload: Record<string, unknown>, secret: string, ttlSeconds: number): string {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds })).toString('base64url');
  return `${body}.${hmac(secret, body).slice(0, 32)}`;
}

export function verifyPayload<T extends Record<string, unknown>>(token: string, secret: string): T | null {
  const [body, sig] = (token || '').split('.');
  if (!body || !sig || !safeEqual(sig, hmac(secret, body).slice(0, 32))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof data.exp !== 'number' || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data as T;
  } catch {
    return null;
  }
}

export function last4(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 4 ? digits.slice(-4) : null;
}
