import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { type Role } from '@/lib/rbac'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  let workspaceRole: Role | undefined
  if (user.workspaceId) {
    const membership = await db.workspaceMember.findFirst({
      where: { userId: user.id, workspaceId: user.workspaceId },
      select: { role: true },
    })
    if (membership) workspaceRole = membership.role as Role
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      workspaceRole: workspaceRole ?? user.role,
      avatarUrl: user.avatarUrl,
      credits: user.credits,
    },
    workspaceId: user.workspaceId,
  })
}
