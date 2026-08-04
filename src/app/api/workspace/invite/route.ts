import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authConfig } from '@/lib/auth'
import { decryptSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/rbac-guards'
import { logAuditEvent } from '@/lib/logging/audit'
import { logActivity } from '@/lib/logging/activity'

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(authConfig.cookieName)?.value
  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await decryptSession(sessionToken)
  if (!payload || !payload.workspaceId) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  // Check permissions - only OWNER and ADMIN can invite
  const permissions = await getUserPermissions(payload.userId, payload.workspaceId)
  if (permissions.role !== 'OWNER' && permissions.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await request.json()
  const { email, role } = body

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  // Check if user is already a member
  const existingUser = await db.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (existingUser) {
    const existingMember = await db.workspaceMember.findFirst({
      where: {
        userId: existingUser.id,
        workspaceId: payload.workspaceId,
      },
    })

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this workspace' }, { status: 400 })
    }
  }

  // Check for pending invitation
  const existingInvitation = await db.invitation.findFirst({
    where: {
      workspaceId: payload.workspaceId,
      inviteeEmail: email,
      status: 'PENDING',
    },
  })

  if (existingInvitation) {
    return NextResponse.json({ error: 'An invitation has already been sent to this email' }, { status: 400 })
  }

  // Create invitation
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const invitation = await db.invitation.create({
    data: {
      workspaceId: payload.workspaceId,
      inviterId: payload.userId,
      inviteeEmail: email,
      role: role || 'MEMBER',
      token,
      expiresAt,
    },
    include: {
      workspace: {
        select: { id: true, name: true, slug: true },
      },
    },
  })

  // TODO: Send invitation email
  // const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${token}`
  // await sendEmail(email, 'You\'ve been invited', `Click here to join: ${inviteUrl}`)

  await logAuditEvent('workspace_member.create', {
    userId: payload.userId,
    workspaceId: payload.workspaceId,
    resource: 'Invitation',
    resourceId: invitation.id,
    metadata: { email, role },
  })
  await logActivity('added_member' as any, {
    userId: payload.userId,
    workspaceId: payload.workspaceId,
    description: `Sent invitation to ${email}`,
  })

  return NextResponse.json({
    success: true,
    invitation: {
      id: invitation.id,
      email: invitation.inviteeEmail,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
    },
  })
}