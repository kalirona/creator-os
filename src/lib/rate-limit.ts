import { headers } from 'next/headers'

const attempts = new Map<string, { count: number; resetAt: number }>()

const LIMITS: Record<'login' | 'register', number> = { login: 10, register: 5 }
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function normalizeIp(ip: string | null | undefined): string {
  if (!ip) return 'unknown'
  return ip.split(',')[0]?.trim() || 'unknown'
}

export async function getClientIp(): Promise<string> {
  const h = await headers()
  return normalizeIp(h.get('x-forwarded-for') || h.get('x-real-ip'))
}

export function getClientIpFromRequest(xForwardedFor: string | null, xRealIp: string | null): string {
  return normalizeIp(xForwardedFor || xRealIp)
}

export function checkRateLimit(
  ip: string,
  action: 'login' | 'register'
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const limit = LIMITS[action]
  const entry = attempts.get(ip)

  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: limit - 1, resetAt: now + WINDOW_MS }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count += 1
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

export function clearRateLimit(ip: string) {
  attempts.delete(ip)
}