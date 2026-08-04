'use server'

import { loginSchema, validatedAction, ActionState } from '@/lib/validations/auth'
import { db } from '@/lib/db'
import { verifyPassword, createSession } from '@/lib/auth'
import { authConfig } from '@/lib/auth'
import { cookies } from 'next/headers'
import { getClientIp, checkRateLimit, clearRateLimit } from '@/lib/rate-limit'
import { logAuditEvent } from '@/lib/logging/audit'
import { logActivity } from '@/lib/logging/activity'

export const login = validatedAction(loginSchema, async (data): Promise<ActionState> => {
  const ip = await getClientIp()
  const rateLimit = checkRateLimit(ip, 'login')
  if (!rateLimit.allowed) {
    return { error: 'Too many login attempts. Please try again later.' }
  }

  const user = await db.user.findUnique({
    where: { email: data.email },
    select: { id: true, email: true, name: true, passwordHash: true, role: true },
  })

  if (!user || !user.passwordHash) {
    return { error: 'Invalid email or password' }
  }

  const isValid = await verifyPassword(data.password, user.passwordHash)
  if (!isValid) {
    return { error: 'Invalid email or password' }
  }

  // Get user's first workspace
  const membership = await db.workspaceMember.findFirst({
    where: { userId: user.id },
    select: { workspaceId: true },
    orderBy: { createdAt: 'asc' },
  })

  const rememberMe = data.rememberMe === 'on'
  const sessionMaxAge = rememberMe ? 90 * 24 * 60 * 60 : authConfig.sessionMaxAge
  const { token } = await createSession(user.id, membership?.workspaceId)

  const cookieStore = await cookies()
  cookieStore.set(authConfig.cookieName, token, {
    maxAge: sessionMaxAge,
    httpOnly: true,
    secure: authConfig.cookieSecure,
    sameSite: 'lax',
  })

  clearRateLimit(ip)

  await logAuditEvent('user.login', {
    userId: user.id,
    workspaceId: membership?.workspaceId,
    resource: 'User',
    resourceId: user.id,
    ipAddress: ip,
  })
  await logActivity('user.login' as any, {
    userId: user.id,
    workspaceId: membership?.workspaceId || undefined,
    description: 'User logged in',
  })

  return { success: true, redirectTo: '/' }
})