import { db } from '@/lib/db'

export type AuditAction =
  | 'user.login'
  | 'user.register'
  | 'user.logout'
  | 'user.update'
  | 'user.delete'
  | 'user.password_reset_request'
  | 'user.password_reset'
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
  | 'community_comment.create'
  | 'community_comment.delete'
  | 'community_space.create'
  | 'community_space.update'
  | 'community_event.create'
  | 'community_invite.create'
  | 'community_badge.award'
  | 'community_report.create'
  | 'community.update'
  | 'community_member.update'
  | 'community_member.suspend'
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

