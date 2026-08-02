import { db } from '@/lib/db'

export type AuditAction =
  | 'user.login'
  | 'user.register'
  | 'user.logout'
  | 'user.update'
  | 'user.delete'
  | 'workspace.create'
  | 'workspace.update'
  | 'workspace_member.create'
  | 'workspace_member.update'
  | 'workspace_member.delete'
  | 'course.create'
  | 'course.update'
  | 'course.delete'
  | 'course.duplicate'
  | 'course.curriculum_update'
  | 'product.create'
  | 'product.update'
  | 'product.delete'
  | 'order.create'
  | 'order.update'
  | 'order.refund'
  | 'page.create'
  | 'page.update'
  | 'page.delete'
  | 'page.publish'
  | 'page.unpublish'
  | 'funnel.create'
  | 'funnel.update'
  | 'funnel.delete'
  | 'domain.connect'
  | 'domain.disconnect'
  | 'blog_post.create'
  | 'blog_post.update'
  | 'blog_post.delete'
  | 'community_post.create'
  | 'community_post.update'
  | 'community_post.delete'
  | 'email_campaign.create'
  | 'email_campaign.update'
  | 'email_campaign.delete'
  | 'admin.setting.update'
  | 'feature_flag.toggle'

export interface AuditLogOptions {
  userId?: string
  workspaceId?: string
  resource?: string
  resourceId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function logAuditEvent(action: AuditAction, options: AuditLogOptions): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action,
        userId: options.userId,
        workspaceId: options.workspaceId,
        resource: options.resource,
        resourceId: options.resourceId,
        metadata: JSON.stringify(options.metadata || {}),
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      },
    })
  } catch (error) {
    console.error('Failed to log audit event:', error)
  }
}

export async function getAuditLogs(params: {
  workspaceId?: string
  userId?: string
  action?: string
  limit?: number
  offset?: number
}): Promise<Array<{
  id: string
  action: string
  resource: string | null
  resourceId: string | null
  metadata: Record<string, unknown>
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  user: { id: string; email: string; name: string } | null
}>> {
  const where: Record<string, unknown> = {}
  if (params.workspaceId) where.workspaceId = params.workspaceId
  if (params.userId) where.userId = params.userId
  if (params.action) where.action = params.action

  const logs = await db.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: params.limit || 100,
    skip: params.offset || 0,
    include: {
      user: {
        select: { id: true, email: true, name: true },
      },
    },
  })

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    resource: log.resource,
    resourceId: log.resourceId,
    metadata: JSON.parse(log.metadata || '{}'),
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    createdAt: log.createdAt,
    user: log.user,
  }))
}
