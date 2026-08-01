import { NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { membershipService } from '@/lib/services'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const ctx = await createRequestContext()
    const plans = await membershipService.list(ctx)
    const totalMembers = plans.reduce((s, p) => s + p.members, 0)
    const mrr = plans.filter((p) => p.interval === 'MONTHLY').reduce((s, p) => s + p.price * p.members, 0) +
      plans.filter((p) => p.interval === 'YEARLY').reduce((s, p) => s + (p.price * p.members) / 12, 0)
    const lifetime = plans.filter((p) => p.interval === 'LIFETIME').reduce((s, p) => s + p.price * p.members, 0)
    return NextResponse.json({
      stats: { totalMembers, mrr, lifetime, arr: mrr * 12, plans: plans.length },
      plans: plans.map((p) => ({ id: p.id, name: p.name, price: p.price, interval: p.interval, members: p.members, status: p.status })),
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
