import { NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { crmService } from '@/lib/services'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const ctx = await createRequestContext()
    const customers = await crmService.list(ctx)
    const orders = await import('@/lib/services/orders').then(m => m.orderService).then(s => s.list(ctx))
    const products = await import('@/lib/services/products').then(m => m.productService).then(s => s.list(ctx))

    const totalRevenue = orders.orders.filter((o: { status: string; amount: number }) => o.status === 'COMPLETED').reduce((s: number, o: { amount: number }) => s + o.amount, 0)
    const avgLtv = customers.reduce((s, c) => s + c.ltv, 0) / (customers.length || 1)
    return NextResponse.json({
      stats: {
        totalRevenue, avgLtv,
        totalCustomers: customers.length,
        activeCustomers: customers.filter((c) => c.status === 'ACTIVE').length,
        churned: customers.filter((c) => c.status === 'CHURNED').length,
        totalOrders: orders.orders.length,
        refunded: orders.orders.filter((o: { status: string }) => o.status === 'REFUNDED').length,
      },
      orders: orders.orders.slice(0, 30).map((o: { id: string; customerName: string; customerEmail: string; amount: number; status: string; productName: string; createdAt: Date }) => ({
        id: o.id, customer: o.customerName, email: o.customerEmail, amount: o.amount,
        status: o.status, product: o.productName || '—', date: o.createdAt,
      })),
      customers: customers.map((c) => ({
        id: c.id, name: c.name, email: c.email, tags: c.tags.split(',').filter(Boolean),
        ltv: c.ltv, orders: c.ordersCount, status: c.status, joined: c.createdAt,
      })),
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
