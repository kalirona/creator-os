import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { authConfig, decryptSession } from '@/lib/auth'
import { getFeatureFlags } from '@/lib/features'
import { getUserPermissions } from '@/lib/rbac-guards'
import { type Role, type Resource, type Action } from '@/lib/rbac'

export interface RequestContext {
  user: {
    id: string
    email: string
    name: string
    avatarUrl: string | null
    role: string
    credits: number
    createdAt: Date
    updatedAt: Date
  }
  workspace: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    plan: string
    createdAt: Date
    updatedAt: Date
  }
  session: {
    id: string
    sessionId: string
    workspaceId?: string
  }
  permissions: { resource: Resource; action: Action }[]
  features: Record<string, boolean>
  plan: string
  locale: string
  timezone: string
}

export async function createRequestContext(): Promise<RequestContext> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(authConfig.cookieName)?.value

  if (!sessionToken) {
    throw new Error('Authentication required')
  }

  const payload = await decryptSession(sessionToken)
  if (!payload) {
    throw new Error('Invalid session')
  }

  const [user, session, membership, flags] = await Promise.all([
    db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true, email: true, name: true, avatarUrl: true, role: true,
        credits: true, createdAt: true, updatedAt: true,
      },
    }),
    db.session.findUnique({
      where: { id: payload.sessionId },
      select: { id: true, userId: true, workspaceId: true },
    }),
    payload.workspaceId
      ? db.workspaceMember.findFirst({
          where: { userId: payload.userId, workspaceId: payload.workspaceId },
          select: { role: true, workspace: { select: { id: true, name: true, slug: true, logoUrl: true, plan: true, createdAt: true, updatedAt: true } } },
        })
      : null,
    getFeatureFlags(payload.workspaceId),
  ])

  if (!user) throw new Error('User not found')
  if (!session) throw new Error('Session not found')

  let workspace
  if (membership?.workspace) {
    workspace = membership.workspace
  } else if (payload.workspaceId) {
    workspace = await db.workspace.findUnique({
      where: { id: payload.workspaceId },
      select: { id: true, name: true, slug: true, logoUrl: true, plan: true, createdAt: true, updatedAt: true },
    })
  } else {
    const member = await db.workspaceMember.findFirst({
      where: { userId: user.id },
      select: { workspace: { select: { id: true, name: true, slug: true, logoUrl: true, plan: true, createdAt: true, updatedAt: true } } },
    })
    workspace = member?.workspace
  }

  if (!workspace) throw new Error('No workspace found')

  const role = (membership?.role || user.role) as Role
  const permissions = await getUserPermissions(user.id, workspace.id)

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      credits: user.credits,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      logoUrl: workspace.logoUrl,
      plan: workspace.plan,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    },
    session: {
      id: session.id,
      sessionId: session.id,
      workspaceId: session.workspaceId || undefined,
    },
    permissions: permissions.permissions,
    features: flags,
    plan: workspace.plan,
    locale: 'en',
    timezone: 'UTC',
  }
}

export async function requirePermission(
  ctx: RequestContext,
  resource: Resource,
  action: Action
): Promise<void> {
  const has = ctx.permissions.some(
    (p) => p.resource === resource && (p.action === 'manage' || p.action === action || action === 'read')
  )
  if (!has) {
    throw new Error(`Permission denied: cannot ${action} ${resource}`)
  }
}
