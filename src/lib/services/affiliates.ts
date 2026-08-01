import { db } from '@/lib/db'
import { type RequestContext, requirePermission } from '@/lib/context'

export class AffiliateService {
  async list(ctx: RequestContext) {
    await requirePermission(ctx, 'affiliate', 'read')
    return db.affiliate.findMany({
      where: { workspaceId: ctx.workspace.id },
      orderBy: { earnings: 'desc' },
    })
  }
}

export const affiliateService = new AffiliateService()
