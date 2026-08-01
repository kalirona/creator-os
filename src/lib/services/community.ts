import { db } from '@/lib/db'
import { logAuditEvent } from '@/lib/logging'
import { type RequestContext, requirePermission } from '@/lib/context'

export class CommunityService {
  async list(ctx: RequestContext) {
    await requirePermission(ctx, 'community_post', 'read')
    const posts = await db.communityPost.findMany({
      where: { workspaceId: ctx.workspace.id },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: { user: true, comments: { include: { user: true }, orderBy: { createdAt: 'asc' } } },
    })

    return posts.map((p) => ({
      id: p.id, title: p.title, content: p.content, category: p.category,
      likesCount: p.likesCount, commentsCount: p.commentsCount, isPinned: p.isPinned,
      createdAt: p.createdAt,
      author: { name: p.user.name, initials: p.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2) },
      comments: p.comments.map((c) => ({
        id: c.id, content: c.content, createdAt: c.createdAt,
        author: { name: c.user.name, initials: c.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2) },
      })),
    }))
  }

  async create(ctx: RequestContext, data: {
    title: string
    content: string
    category?: string
  }) {
    await requirePermission(ctx, 'community_post', 'create')

    if (!data.title || !data.content) throw new Error('Title and content required')

    const post = await db.communityPost.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category || 'General',
        userId: ctx.user.id,
        workspaceId: ctx.workspace.id,
      },
      include: { user: true },
    })

    await logAuditEvent('community_post.create', {
      userId: ctx.user.id,
      workspaceId: ctx.workspace.id,
      resource: 'CommunityPost',
      resourceId: post.id,
    })

    return {
      id: post.id, title: post.title, content: post.content, category: post.category,
      likesCount: 0, commentsCount: 0, isPinned: false, createdAt: post.createdAt,
      author: { name: post.user.name, initials: post.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2) },
      comments: [],
    }
  }
}

export const communityService = new CommunityService()
