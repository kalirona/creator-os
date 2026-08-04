import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authConfig } from '@/lib/auth'
import { decryptSession } from '@/lib/auth'
import { logAuditEvent } from '@/lib/logging/audit'
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
  const { name, slug } = body

  if (!name || !slug) {
    return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
  }

  // Check slug uniqueness
  const existing = await db.workspace.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: 'Workspace slug already taken' }, { status: 400 })
  }

  // Create workspace and add user as owner
  const result = await db.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: { name, slug },
    })

    await tx.workspaceMember.create({
      data: {
        userId: payload.userId,
        workspaceId: workspace.id,
        role: 'OWNER',
      },
    })

    return workspace
  })

  await logAuditEvent('workspace.create', {
    userId: payload.userId,
    workspaceId: result.id,
    resource: 'Workspace',
    resourceId: result.id,
  })
  await logActivity('added_member' as any, {
    userId: payload.userId,
    workspaceId: result.id,
    description: `Created workspace: ${name}`,
  })

  return NextResponse.json({ success: true, workspace: { id: result.id, name: result.name, slug: result.slug } })
}