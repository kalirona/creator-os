import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authConfig } from '@/lib/auth'
import { checkRateLimit, getClientIpFromRequest } from '@/lib/rate-limit'
import { logAuditEvent } from '@/lib/logging/audit'

export async function POST(request: NextRequest) {
  const ip = getClientIpFromRequest(
    request.headers.get('x-forwarded-for'),
    request.headers.get('x-real-ip')
  )
  const body = await request.json()
  const { email } = body

  const rateLimit = checkRateLimit(ip, 'forgot-password')
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  })

  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({ success: true, message: 'If an account exists, a reset email has been sent.' })
  }

  // Invalidate any existing unused reset tokens
  await db.passwordReset.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  })

  // Create reset token
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await db.passwordReset.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  })

  await logAuditEvent('user.password_reset_request', {
    userId: user.id,
    resource: 'User',
    resourceId: user.id,
    ipAddress: ip,
    userAgent: request.headers.get('user-agent') || undefined,
  })

  return NextResponse.json({ success: true, message: 'If an account exists, a reset email has been sent.' })
}
