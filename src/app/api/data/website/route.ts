import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET() {
  const pages = await db.webPage.findMany({ orderBy: { visits: 'desc' } })
  return NextResponse.json({
    stats: {
      pages: pages.length,
      totalVisits: pages.reduce((s, p) => s + p.visits, 0),
      published: pages.filter((p) => p.status === 'PUBLISHED').length,
    },
    pages: pages.map((p) => ({ id: p.id, title: p.title, slug: p.slug, type: p.type, status: p.status, visits: p.visits })),
  })
}
