import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function GET() {
  const flags = await db.featureFlag.findMany({ orderBy: { key: 'asc' } })
  return NextResponse.json({ flags })
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, enabled } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const flag = await db.featureFlag.update({ where: { id }, data: { enabled: !!enabled } })
    return NextResponse.json({ success: true, flag })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
