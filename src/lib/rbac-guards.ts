import { db } from '@/lib/db'
import { ALL_PERMISSIONS, hasPermission, type Role, type Resource, type Action } from '@/lib/rbac'

export async function checkWorkspacePermission(
  userId: string,
  workspaceId: string,
  resource: Resource,
  action: Action
): Promise<boolean> {
  const membership = await db.workspaceMember.findFirst({
    where: { userId, workspaceId },
    select: { role: true },
  })

  if (!membership) return false

  return hasPermission(membership.role as Role, resource, action)
}

export async function requireWorkspacePermission(
  userId: string,
  workspaceId: string,
  resource: Resource,
  action: Action
): Promise<void> {
  const allowed = await checkWorkspacePermission(userId, workspaceId, resource, action)
  if (!allowed) {
    throw new Error(`Permission denied: cannot ${action} ${resource} in workspace ${workspaceId}`)
  }
}

export async function getUserWorkspaceRole(
  userId: string,
  workspaceId: string
): Promise<Role | null> {
  const membership = await db.workspaceMember.findFirst({
    where: { userId, workspaceId },
    select: { role: true },
  })

  return (membership?.role as Role) || null
}

export async function getUserPermissions(
  userId: string,
  workspaceId: string
): Promise<{ role: Role; permissions: { resource: Resource; action: Action }[] }> {
  const membership = await db.workspaceMember.findFirst({
    where: { userId, workspaceId },
    select: { role: true },
  })

  if (!membership) {
    return { role: 'GUEST', permissions: [] }
  }

  const role = membership.role as Role
  const permissions = ALL_PERMISSIONS
    .filter((p) => p.role === role)
    .map((p) => ({ resource: p.resource, action: p.action }))

  return { role, permissions }
}
