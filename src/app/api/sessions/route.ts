import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authConfig } from '@/lib/auth'
import { decryptSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get(authConfig.cookieName)?.value
  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await decryptSession(sessionToken)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  // Get all active sessions for the user
  const sessions = await db.session.findMany({
    where: {
      userId: payload.userId,
      expiresAt: { gte: new Date() },
    },
    select: {
      id: true,
      userAgent: true,
      ipAddress: true,
      expiresAt: true,
      createdAt: true,
      lastSeenAt: true,
      workspaceId: true,
    },
    orderBy: { lastSeenAt: 'desc' },
  })

  // Mark current session
  const sessionsWithCurrent = sessions.map(session => ({
    ...session,
    isCurrent: session.id === payload.sessionId,
  }))

  return NextResponse.json({ success: true, sessions: sessionsWithCurrent })
}

export async function DELETE(request: NextRequest) {
  const sessionToken = request.cookies.get(authConfig.cookieName)?.value
  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await decryptSession(sessionToken)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  const body = await request.json()
  const { sessionId, revokeAll } = body

  if (revokeAll) {
    // Revoke all sessions except current
    await db.session.deleteMany({
      where: {
        userId: payload.userId,
        id: { not: payload.sessionId },
      },
    })

    return NextResponse.json({ success: true, message: 'All other sessions have been revoked' })
  }

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
  }

  // Don't allow revoking current session via this endpoint
  if (sessionId === payload.sessionId) {
    return NextResponse.json({ error: 'Cannot revoke current session. Use logout instead.' }, { status: 400 })
  }

  await db.session.delete({
    where: { id: sessionId },
  })

  return NextResponse.json({ success: true, message: 'Session revoked successfully' })
}