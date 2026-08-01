import { db } from '@/lib/db'
import { type RequestContext, requirePermission } from '@/lib/context'

export class FunnelService {
  async list(ctx: RequestContext) {
    await requirePermission(ctx, 'funnel', 'read')
    return db.funnel.findMany({
      where: { workspaceId: ctx.workspace.id },
      orderBy: { createdAt: 'desc' },
      include: { steps: true },
    })
  }
}

export const funnelService = new FunnelService()
