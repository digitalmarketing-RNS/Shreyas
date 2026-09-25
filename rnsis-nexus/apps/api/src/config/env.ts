import 'dotenv/config';
import { z } from 'zod';

/**
 * Environment configuration, validated once at boot. Anything optional here has a safe
 * development default; production deployments must set the secrets (see .env.example).
 */
const bool = (def: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? def : ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())));

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  APP_URL: z.string().default('http://localhost:5173'),
  API_URL: z.string().default('http://localhost:4000'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:4173'),
  DATABASE_URL: z.string(),
  SCHOOL_CODE: z.string().default('RNSIS'),

  JWT_ACCESS_SECRET: z.string().min(16).default('dev-access-secret-change-me-please'),
  JWT_REFRESH_SECRET: z.string().min(16).default('dev-refresh-secret-change-me-please'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().default(900),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().default(14),
  /** 32-byte key (base64 or hex) for AES-256-GCM field encryption. */
  FIELD_ENCRYPTION_KEY: z.string().default('ZGV2LWZpZWxkLWVuY3J5cHRpb24ta2V5LTMyYnl0ZXM='),
  PAY_LINK_SECRET: z.string().min(16).default('dev-pay-link-secret-change-me'),

  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default('./storage'),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('ap-south-1'),
  S3_BUCKET: z.string().default('rnsis-nexus'),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: bool(true),

  PAYMENT_GATEWAY: z.enum(['razorpay', 'stripe', 'mock']).default('mock'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  MOCK_GATEWAY_SECRET: z.string().default('mock-gateway-secret'),

  EMAIL_DRIVER: z.enum(['log', 'smtp', 'sendgrid']).default('log'),
  EMAIL_FROM: z.string().default('RNSIS International School <no-reply@rnsis.edu.in>'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: bool(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),

  SMS_DRIVER: z.enum(['log', 'msg91', 'twilio']).default('log'),
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_SENDER_ID: z.string().default('RNSISB'),
  MSG91_DEFAULT_TEMPLATE_ID: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM: z.string().optional(),

  WHATSAPP_DRIVER: z.enum(['log', 'cloud']).default('log'),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().default('rnsis-whatsapp-verify'),
  WHATSAPP_APP_SECRET: z.string().optional(),
  WHATSAPP_API_VERSION: z.string().default('v21.0'),

  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('claude-sonnet-5'),

  JOBS_ENABLED: bool(true),
  CRON_ENABLED: bool(true),
  BACKUP_DIR: z.string().default('./backups'),
  BACKUP_RETENTION_DAYS: z.coerce.number().default(30),
  PG_DUMP_PATH: z.string().default('pg_dump'),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().default(300),
  SWAGGER_ENABLED: bool(true),
});

export type Env = z.infer<typeof EnvSchema>;

function load(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }
  const env = parsed.data;
  if (env.NODE_ENV === 'production') {
    const insecure = (['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'PAY_LINK_SECRET'] as const).filter((k) => env[k].startsWith('dev-'));
    if (insecure.length) throw new Error(`Refusing to start in production with development secrets: ${insecure.join(', ')}`);
  }
  return env;
}

export const env: Env = load();
