import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function GET() {
  const providers = await db.aiProvider.findMany({ include: { models: true }, orderBy: { priority: 'asc' } })
  return NextResponse.json({ providers })
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const allowed = ['name', 'apiKey', 'baseUrl', 'isActive', 'priority']
    const data: Record<string, unknown> = {}
    for (const k of allowed) if (k in updates) data[k] = updates[k]
    const provider = await db.aiProvider.update({ where: { id }, data })
    return NextResponse.json({ success: true, provider })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
