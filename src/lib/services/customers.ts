import { db } from '@/lib/db'
import { type RequestContext, requirePermission } from '@/lib/context'

export class CustomerService {
  async list(ctx: RequestContext) {
    await requirePermission(ctx, 'customer', 'read')
    const customers = await db.customer.findMany({
      where: { workspaceId: ctx.workspace.id },
      orderBy: { createdAt: 'desc' },
    })
    return customers
  }
}

export const customerService = new CustomerService()
