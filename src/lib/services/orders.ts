import { db } from '@/lib/db'
import { type RequestContext, requirePermission } from '@/lib/context'

export class OrderService {
  async list(ctx: RequestContext) {
    await requirePermission(ctx, 'order', 'read')
    const orders = await db.order.findMany({
      where: { workspaceId: ctx.workspace.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { product: { select: { name: true } } },
    })

    return {
      orders: orders.map((o) => ({
        id: o.id, customerName: o.customerName, customerEmail: o.customerEmail,
        amount: o.amount, currency: o.currency, status: o.status,
        productName: o.product?.name || 'N/A',
        createdAt: o.createdAt,
      })),
      stats: {
        total: orders.length,
        revenue: orders.filter(o => o.status === 'COMPLETED').reduce((s, o) => s + o.amount, 0),
        refunds: orders.filter(o => o.status === 'REFUNDED').reduce((s, o) => s + o.amount, 0),
        pending: orders.filter(o => o.status === 'PENDING').length,
      },
    }
  }
}

export const orderService = new OrderService()
