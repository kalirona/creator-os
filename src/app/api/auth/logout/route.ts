import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { decryptSession, destroySession } from '@/lib/auth'
import { authConfig } from '@/lib/auth'
import { logAuditEvent } from '@/lib/logging/audit'
import { logActivity } from '@/lib/logging/activity'

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(authConfig.cookieName)?.value
  
  if (sessionToken) {
    const payload = await decryptSession(sessionToken)
    if (payload) {
      const session = await db.session.findUnique({
        where: { id: payload.sessionId },
        include: { user: true },
      })
      
      await destroySession(payload.sessionId)
      
      if (session) {
        await logAuditEvent('user.logout', {
          userId: session.userId,
          workspaceId: payload.workspaceId,
          resource: 'Session',
          resourceId: session.id,
          ipAddress: request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        })
        await logActivity('user.logout' as any, {
          userId: session.userId,
          workspaceId: payload.workspaceId || undefined,
          description: 'User logged out',
        })
      }
    }
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete(authConfig.cookieName)
  return response
}