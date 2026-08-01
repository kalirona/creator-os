import { db } from '@/lib/db'
import { type RequestContext, requirePermission } from '@/lib/context'

export class PageService {
  async list(ctx: RequestContext) {
    await requirePermission(ctx, 'page', 'read')
    return db.webPage.findMany({
      where: { workspaceId: ctx.workspace.id },
      orderBy: { createdAt: 'desc' },
    })
  }
}

export const pageService = new PageService()
