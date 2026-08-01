import { db } from '@/lib/db'

export type ActivityAction =
  | 'started_editing'
  | 'saved_content'
  | 'published_course'
  | 'unpublished_course'
  | 'enrolled_student'
  | 'completed_lesson'
  | 'sent_email'
  | 'created_order'
  | 'refunded_order'
  | 'updated_settings'
  | 'changed_plan'
  | 'added_member'
  | 'removed_member'

export interface ActivityLogOptions {
  userId?: string
  workspaceId?: string
  description?: string
  metadata?: Record<string, unknown>
}

export async function logActivity(action: ActivityAction, options: ActivityLogOptions): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        action,
        userId: options.userId,
        workspaceId: options.workspaceId,
        description: options.description || '',
        metadata: JSON.stringify(options.metadata || {}),
      },
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}

export async function getActivityLogs(params: {
  workspaceId?: string
  userId?: string
  limit?: number
  offset?: number
}): Promise<Array<{
  id: string
  action: string
  description: string
  metadata: Record<string, unknown>
  createdAt: Date
  user: { id: string; email: string; name: string; avatarUrl: string | null } | null
}>> {
  const where: Record<string, unknown> = {}
  if (params.workspaceId) where.workspaceId = params.workspaceId
  if (params.userId) where.userId = params.userId

  const logs = await db.activityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: params.limit || 50,
    skip: params.offset || 0,
    include: {
      user: {
        select: { id: true, email: true, name: true, avatarUrl: true },
      },
    },
  })

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    description: log.description,
    metadata: JSON.parse(log.metadata || '{}'),
    createdAt: log.createdAt,
    user: log.user,
  }))
}
