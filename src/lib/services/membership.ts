import { db } from '@/lib/db'
import { type RequestContext, requirePermission } from '@/lib/context'

export class MembershipService {
  async list(ctx: RequestContext) {
    await requirePermission(ctx, 'membership_plan', 'read')
    return db.membershipPlan.findMany({
      where: { workspaceId: ctx.workspace.id },
      orderBy: { price: 'asc' },
    })
  }
}

export const membershipService = new MembershipService()
