import { db } from '@/lib/db'
import { type RequestContext, requirePermission } from '@/lib/context'

export class CRMService {
  async list(ctx: RequestContext) {
    await requirePermission(ctx, 'customer', 'read')
    return db.customer.findMany({
      where: { workspaceId: ctx.workspace.id },
      orderBy: { createdAt: 'desc' },
    })
  }
}

export const crmService = new CRMService()
