import { db } from '@/lib/db'
import { type RequestContext, requirePermission } from '@/lib/context'

export class DashboardService {
  async getStats(ctx: RequestContext) {
    await requirePermission(ctx, 'order', 'read')

    const [courses, products, orders, customers, posts, campaigns, affiliates, pages, plans] = await Promise.all([
      db.course.findMany({ where: { workspaceId: ctx.workspace.id }, orderBy: { studentsCount: 'desc' } }),
      db.product.findMany({ where: { workspaceId: ctx.workspace.id }, orderBy: { salesCount: 'desc' } }),
      db.order.findMany({ where: { workspaceId: ctx.workspace.id }, orderBy: { createdAt: 'desc' }, include: { product: true } }),
      db.customer.findMany({ where: { workspaceId: ctx.workspace.id } }),
      db.communityPost.findMany({ where: { workspaceId: ctx.workspace.id }, orderBy: { createdAt: 'desc' }, include: { user: true } }),
      db.emailCampaign.findMany({ where: { workspaceId: ctx.workspace.id } }),
      db.affiliate.findMany({ where: { workspaceId: ctx.workspace.id } }),
      db.webPage.findMany({ where: { workspaceId: ctx.workspace.id } }),
      db.membershipPlan.findMany({ where: { workspaceId: ctx.workspace.id } }),
    ])

    const revenue = orders.filter((o) => o.status === 'COMPLETED').reduce((s, o) => s + o.amount, 0)
    const refunded = orders.filter((o) => o.status === 'REFUNDED').reduce((s, o) => s + o.amount, 0)
    const totalStudents = courses.reduce((s, c) => s + c.studentsCount, 0)
    const avgRating = courses.reduce((s, c) => s + c.rating, 0) / (courses.length || 1)
    const activeMembers = plans.reduce((s, p) => s + p.members, 0)
    const mrr = plans.filter((p) => p.interval === 'MONTHLY').reduce((s, p) => s + p.price * p.members, 0) +
      plans.filter((p) => p.interval === 'YEARLY').reduce((s, p) => s + (p.price * p.members) / 12, 0)

    const days: { date: string; revenue: number; orders: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const dayOrders = orders.filter((o) => {
        const od = new Date(o.createdAt)
        return od.toDateString() === d.toDateString() && o.status === 'COMPLETED'
      })
      days.push({
        date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        revenue: dayOrders.reduce((s, o) => s + o.amount, 0),
        orders: dayOrders.length,
      })
    }

    const byType: Record<string, number> = {}
    orders.forEach((o) => {
      if (o.status !== 'COMPLETED' || !o.product) return
      byType[o.product.type] = (byType[o.product.type] || 0) + o.amount
    })

    const topProducts = products.slice(0, 5).map((p) => ({ name: p.name, sales: p.salesCount, revenue: p.salesCount * p.price }))
    const recentOrders = orders.slice(0, 6).map((o) => ({
      id: o.id, customer: o.customerName, email: o.customerEmail, amount: o.amount,
      status: o.status, product: o.product?.name || '—', time: o.createdAt,
    }))

    return {
      workspace: { name: ctx.workspace.name, plan: ctx.workspace.plan, slug: ctx.workspace.slug },
      stats: {
        revenue, refunded, mrr, totalStudents, activeMembers,
        courses: courses.length, products: products.length, customers: customers.length,
        avgRating: Number(avgRating.toFixed(2)), posts: posts.length,
        affiliates: affiliates.length, pages: pages.length,
      },
      charts: {
        revenue14d: days,
        salesByType: Object.entries(byType).map(([type, amount]) => ({ type, amount })),
        topProducts,
      },
      recentOrders,
      team: ctx.workspace.id,
    }
  }
}

export const dashboardService = new DashboardService()
