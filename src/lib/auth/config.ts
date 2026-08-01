import { z } from 'zod'

const envSchema = z.object({
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  DATABASE_URL: z.string(),
})

const parsed = envSchema.safeParse({
  AUTH_SECRET: process.env.AUTH_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
})

if (!parsed.success && process.env.NODE_ENV !== 'production') {
  console.warn('Auth environment variables not configured:', parsed.error.flatten())
}

export const authConfig = {
  secret: process.env.AUTH_SECRET || 'creatoros-dev-secret-key-change-in-production-32chars',
  cookieName: 'creatoros.session',
  sessionMaxAge: 30 * 24 * 60 * 60, // 30 days
  refreshTokenMaxAge: 90 * 24 * 60 * 60, // 90 days
  issuer: 'creatoros',
  algorithm: 'HS256' as const,
  // Secure cookies are rejected by browsers over plain HTTP. Allow opting out
  // via AUTH_COOKIE_SECURE=false (e.g. when serving behind a non-SSL proxy).
  cookieSecure: process.env.AUTH_COOKIE_SECURE ? process.env.AUTH_COOKIE_SECURE === 'true' : process.env.NODE_ENV === 'production',
}
