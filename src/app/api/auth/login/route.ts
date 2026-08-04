import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSession } from '@/lib/auth'
import { authConfig } from '@/lib/auth'
import { checkRateLimit, clearRateLimit, getClientIpFromRequest } from '@/lib/rate-limit'
import { logAuditEvent } from '@/lib/logging/audit'
import { logActivity } from '@/lib/logging/activity'

export async function POST(request: NextRequest) {
  const ip = getClientIpFromRequest(
    request.headers.get('x-forwarded-for'),
    request.headers.get('x-real-ip')
  )
  const body = await request.json()
  const { email, password, rememberMe } = body

  const rateLimit = checkRateLimit(ip, 'login')
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
    )
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, passwordHash: true, role: true },
  })

  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const isValid = await verifyPassword(password, user.passwordHash)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  // Get user's first workspace or create session without workspace
  const membership = await db.workspaceMember.findFirst({
    where: { userId: user.id },
    select: { workspaceId: true },
    orderBy: { createdAt: 'asc' },
  })

  const sessionMaxAge = rememberMe ? 90 * 24 * 60 * 60 : authConfig.sessionMaxAge
  const { token, session } = await createSession(user.id, membership?.workspaceId)

  const response = NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    workspaceId: membership?.workspaceId,
  })
  
  response.cookies.set(authConfig.cookieName, token, {
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
    userAgent: request.headers.get('user-agent') || undefined,
  })
  await logActivity('user.login' as any, {
    userId: user.id,
    workspaceId: membership?.workspaceId || undefined,
    description: 'User logged in',
  })

  return response
}