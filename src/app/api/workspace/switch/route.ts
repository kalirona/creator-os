import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authConfig } from '@/lib/auth'
import { decryptSession, encryptSession } from '@/lib/auth'
import { logActivity } from '@/lib/logging/activity'

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(authConfig.cookieName)?.value
  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await decryptSession(sessionToken)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  const body = await request.json()
  const { workspaceId } = body

  if (!workspaceId) {
    return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 })
  }

  // Verify user is a member of this workspace
  const membership = await db.workspaceMember.findFirst({
    where: {
      userId: payload.userId,
      workspaceId,
    },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          plan: true,
        },
      },
    },
  })

  if (!membership) {
    return NextResponse.json({ error: 'You do not have access to this workspace' }, { status: 403 })
  }

  // Create new session with new workspace
  const newToken = await encryptSession({
    userId: payload.userId,
    sessionId: payload.sessionId,
    workspaceId,
  })

  // Update session record
  await db.session.update({
    where: { id: payload.sessionId },
    data: { workspaceId },
  })

  await logActivity('updated_settings' as any, {
    userId: payload.userId,
    workspaceId,
    description: `Switched to workspace: ${membership.workspace.name}`,
  })

  const response = NextResponse.json({
    success: true,
    workspace: membership.workspace,
    role: membership.role,
  })
  
  response.cookies.set(authConfig.cookieName, newToken, {
    maxAge: authConfig.sessionMaxAge,
    httpOnly: true,
    secure: authConfig.cookieSecure,
    sameSite: 'lax',
  })

  return response
}