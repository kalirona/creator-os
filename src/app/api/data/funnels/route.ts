import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function GET() {
  const funnels = await db.funnel.findMany({ orderBy: { createdAt: 'desc' }, include: { steps: { orderBy: { position: 'asc' }, include: { page: { select: { id: true, title: true, slug: true } } } } } })
  return NextResponse.json({
    funnels: funnels.map((f) => ({
      id: f.id, name: f.name, description: f.description, type: f.type, status: f.status,
      visits: f.visits, conversions: f.conversions, revenue: f.revenue, createdAt: f.createdAt,
      steps: f.steps.map((s) => ({ id: s.id, name: s.name, type: s.type, position: s.position, isRequired: s.isRequired, page: s.page })),
    })),
    stats: {
      total: funnels.length,
      live: funnels.filter((f) => f.status === 'LIVE').length,
      totalVisits: funnels.reduce((s, f) => s + f.visits, 0),
      totalRevenue: funnels.reduce((s, f) => s + f.revenue, 0),
    },
  })
}
