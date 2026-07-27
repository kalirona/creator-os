import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'
export async function GET() {
  const pages = await db.webPage.findMany({ orderBy: { visits: 'desc' } })
  const plans = await db.membershipPlan.findMany({ orderBy: { price: 'asc' } })
  return NextResponse.json({ pages, plans })
}
