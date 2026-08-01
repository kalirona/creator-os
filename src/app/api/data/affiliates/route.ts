import { NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { affiliateService } from '@/lib/services'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const ctx = await createRequestContext()
    const affiliates = await affiliateService.list(ctx)
    const totalEarnings = affiliates.reduce((s, a) => s + a.earnings, 0)
    const totalClicks = affiliates.reduce((s, a) => s + a.clicks, 0)
    const totalConversions = affiliates.reduce((s, a) => s + a.conversions, 0)
    return NextResponse.json({
      stats: {
        totalEarnings, totalClicks, totalConversions,
        affiliates: affiliates.length,
        avgConversionRate: totalClicks ? (totalConversions / totalClicks) * 100 : 0,
        pendingPayouts: totalEarnings * 0.3,
      },
      affiliates: affiliates.map((a) => ({
        id: a.id, name: a.name, email: a.email, code: a.code, clicks: a.clicks,
        conversions: a.conversions, earnings: a.earnings, commissionRate: a.commissionRate, status: a.status,
      })),
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
