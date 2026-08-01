import { NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { customerService } from '@/lib/services'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const ctx = await createRequestContext()
    const customers = await customerService.list(ctx)
    return NextResponse.json({
      customers: customers.map((c) => ({
        id: c.id, name: c.name, email: c.email, tags: c.tags.split(',').filter(Boolean),
        ltv: c.ltv, ordersCount: c.ordersCount, status: c.status, createdAt: c.createdAt,
      })),
      stats: {
        total: customers.length,
        active: customers.filter(c => c.status === 'ACTIVE').length,
        totalLTV: customers.reduce((s, c) => s + c.ltv, 0),
        avgLTV: customers.length ? customers.reduce((s, c) => s + c.ltv, 0) / customers.length : 0,
      },
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
