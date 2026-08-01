import { db } from '@/lib/db'
import { type RequestContext, requirePermission } from '@/lib/context'

export class BlogService {
  async list(ctx: RequestContext) {
    await requirePermission(ctx, 'page', 'read')
    return db.blogPost.findMany({
      where: { workspaceId: ctx.workspace.id },
      orderBy: { createdAt: 'desc' },
    })
  }
}

export const blogService = new BlogService()
