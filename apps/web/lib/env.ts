import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_PRICE_INDIE: z.string().min(1),
  STRIPE_PRICE_PRO: z.string().min(1),
  TERMSKIT_HMAC_SECRET: z.string().min(32, 'HMAC_SECRET must be at least 32 characters'),
  CRON_SECRET: z.string().min(32, 'CRON_SECRET must be at least 32 characters'),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (_env) return _env;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    // During build / CI without real env vars, fall back to empty strings
    _env = {
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? '',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? '',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? '',
      RESEND_API_KEY: process.env.RESEND_API_KEY ?? '',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? '',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? '',
      STRIPE_PRICE_INDIE: process.env.STRIPE_PRICE_INDIE ?? '',
      STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO ?? '',
      TERMSKIT_HMAC_SECRET: process.env.TERMSKIT_HMAC_SECRET ?? '',
      CRON_SECRET: process.env.CRON_SECRET ?? '',
    };
  } else {
    _env = result.data;
  }
  return _env;
}

// Proxy so callers can use env.SOME_KEY directly
export const env = new Proxy({} as Env, {
  get(_, key: string) {
    return getEnv()[key as keyof Env];
  },
});
