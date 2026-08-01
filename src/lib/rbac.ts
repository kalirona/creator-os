export type Role = 'OWNER' | 'ADMIN' | 'MANAGER' | 'INSTRUCTOR' | 'MODERATOR' | 'MEMBER' | 'STUDENT' | 'AFFILIATE' | 'GUEST'

export type Resource =
  | 'course'
  | 'product'
  | 'community_post'
  | 'community_comment'
  | 'order'
  | 'customer'
  | 'email_campaign'
  | 'affiliate'
  | 'page'
  | 'funnel'
  | 'membership_plan'
  | 'web_page'
  | 'ai_tool'
  | 'workspace_setting'
  | 'workspace_member'
  | 'admin_setting'
  | 'feature_flag'
  | 'audit_log'
  | 'activity_log'

export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage'

export interface Permission {
  role: Role
  resource: Resource
  action: Action
}

const OWNER_PERMISSIONS: Permission[] = [
  { role: 'OWNER', resource: 'course', action: 'manage' },
  { role: 'OWNER', resource: 'product', action: 'manage' },
  { role: 'OWNER', resource: 'community_post', action: 'manage' },
  { role: 'OWNER', resource: 'community_comment', action: 'manage' },
  { role: 'OWNER', resource: 'order', action: 'manage' },
  { role: 'OWNER', resource: 'customer', action: 'manage' },
  { role: 'OWNER', resource: 'email_campaign', action: 'manage' },
  { role: 'OWNER', resource: 'affiliate', action: 'manage' },
  { role: 'OWNER', resource: 'page', action: 'manage' },
  { role: 'OWNER', resource: 'funnel', action: 'manage' },
  { role: 'OWNER', resource: 'membership_plan', action: 'manage' },
  { role: 'OWNER', resource: 'web_page', action: 'manage' },
  { role: 'OWNER', resource: 'ai_tool', action: 'manage' },
  { role: 'OWNER', resource: 'workspace_setting', action: 'manage' },
  { role: 'OWNER', resource: 'workspace_member', action: 'manage' },
  { role: 'OWNER', resource: 'audit_log', action: 'read' },
  { role: 'OWNER', resource: 'activity_log', action: 'read' },
]

const ADMIN_PERMISSIONS: Permission[] = [
  { role: 'ADMIN', resource: 'course', action: 'manage' },
  { role: 'ADMIN', resource: 'product', action: 'manage' },
  { role: 'ADMIN', resource: 'community_post', action: 'manage' },
  { role: 'ADMIN', resource: 'community_comment', action: 'manage' },
  { role: 'ADMIN', resource: 'order', action: 'read' },
  { role: 'ADMIN', resource: 'customer', action: 'manage' },
  { role: 'ADMIN', resource: 'email_campaign', action: 'manage' },
  { role: 'ADMIN', resource: 'affiliate', action: 'read' },
  { role: 'ADMIN', resource: 'page', action: 'manage' },
  { role: 'ADMIN', resource: 'funnel', action: 'manage' },
  { role: 'ADMIN', resource: 'membership_plan', action: 'manage' },
  { role: 'ADMIN', resource: 'web_page', action: 'manage' },
  { role: 'ADMIN', resource: 'workspace_setting', action: 'read' },
  { role: 'ADMIN', resource: 'workspace_member', action: 'read' },
  { role: 'ADMIN', resource: 'audit_log', action: 'read' },
  { role: 'ADMIN', resource: 'activity_log', action: 'read' },
]

const INSTRUCTOR_PERMISSIONS: Permission[] = [
  { role: 'INSTRUCTOR', resource: 'course', action: 'create' },
  { role: 'INSTRUCTOR', resource: 'course', action: 'read' },
  { role: 'INSTRUCTOR', resource: 'course', action: 'update' },
  { role: 'INSTRUCTOR', resource: 'community_post', action: 'create' },
  { role: 'INSTRUCTOR', resource: 'community_post', action: 'read' },
  { role: 'INSTRUCTOR', resource: 'community_post', action: 'update' },
  { role: 'INSTRUCTOR', resource: 'community_comment', action: 'create' },
  { role: 'INSTRUCTOR', resource: 'community_comment', action: 'read' },
  { role: 'INSTRUCTOR', resource: 'community_comment', action: 'update' },
  { role: 'INSTRUCTOR', resource: 'order', action: 'read' },
  { role: 'INSTRUCTOR', resource: 'customer', action: 'read' },
  { role: 'INSTRUCTOR', resource: 'page', action: 'read' },
  { role: 'INSTRUCTOR', resource: 'funnel', action: 'read' },
]

const MEMBER_PERMISSIONS: Permission[] = [
  { role: 'MEMBER', resource: 'course', action: 'read' },
  { role: 'MEMBER', resource: 'community_post', action: 'create' },
  { role: 'MEMBER', resource: 'community_post', action: 'read' },
  { role: 'MEMBER', resource: 'community_post', action: 'update' },
  { role: 'MEMBER', resource: 'community_comment', action: 'create' },
  { role: 'MEMBER', resource: 'community_comment', action: 'read' },
  { role: 'MEMBER', resource: 'community_comment', action: 'update' },
  { role: 'MEMBER', resource: 'page', action: 'read' },
]

const STUDENT_PERMISSIONS: Permission[] = [
  { role: 'STUDENT', resource: 'course', action: 'read' },
  { role: 'STUDENT', resource: 'community_post', action: 'read' },
  { role: 'STUDENT', resource: 'community_comment', action: 'create' },
  { role: 'STUDENT', resource: 'community_comment', action: 'read' },
  { role: 'STUDENT', resource: 'page', action: 'read' },
]

export const ALL_PERMISSIONS: Permission[] = [
  ...OWNER_PERMISSIONS,
  ...ADMIN_PERMISSIONS,
  ...INSTRUCTOR_PERMISSIONS,
  ...MEMBER_PERMISSIONS,
  ...STUDENT_PERMISSIONS,
]

export function hasPermission(
  role: Role,
  resource: Resource,
  action: Action
): boolean {
  return ALL_PERMISSIONS.some(
    (p) => p.role === role && p.resource === resource && (p.action === 'manage' || p.action === action || action === 'read')
  )
}

export function hasPermissionOrThrow(
  role: Role,
  resource: Resource,
  action: Action
): void {
  if (!hasPermission(role, resource, action)) {
    throw new Error(`Permission denied: ${role} cannot ${action} ${resource}`)
  }
}

export function getResourcePermissions(role: Role): Permission[] {
  return ALL_PERMISSIONS.filter((p) => p.role === role)
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 100,
  ADMIN: 90,
  MANAGER: 80,
  INSTRUCTOR: 70,
  MODERATOR: 60,
  MEMBER: 50,
  STUDENT: 40,
  AFFILIATE: 30,
  GUEST: 20,
}

export function canAccess(role: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole]
}
