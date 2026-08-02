import { db } from '@/lib/db'
import { ALL_PERMISSIONS, type Role, type Resource, type Action } from '@/lib/rbac'

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
