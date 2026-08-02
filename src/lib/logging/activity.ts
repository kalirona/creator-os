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

