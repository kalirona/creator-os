import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { logAuditEvent } from '@/lib/logging/audit'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { token, password } = body

  if (!token || !password) {
    return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
  }

  const resetRecord = await db.passwordReset.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!resetRecord || resetRecord.expiresAt < new Date() || resetRecord.usedAt) {
    return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
  }

  // Validate password strength
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const passwordHash = await hashPassword(password)

  await db.$transaction(async (tx) => {
    // Update user password
    await tx.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    })

    // Mark reset token as used
    await tx.passwordReset.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    })

    // Invalidate all existing sessions
    await tx.session.deleteMany({
      where: { userId: resetRecord.userId },
    })
  })

  await logAuditEvent('user.password_reset', {
    userId: resetRecord.userId,
    resource: 'User',
    resourceId: resetRecord.userId,
    ipAddress: request.headers.get('x-real-ip') || undefined,
    userAgent: request.headers.get('user-agent') || undefined,
  })

  return NextResponse.json({ success: true, message: 'Password has been reset. Please log in.' })
}