import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createRequestContext } from '@/lib/context'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  let ctx
  try {
    ctx = await createRequestContext()
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  if (ctx.user.role !== 'ADMIN' && ctx.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function GET() {
  const authError = await requireAdmin()
  if (authError) return authError

  const flags = await db.featureFlag.findMany({ orderBy: { key: 'asc' } })
  return NextResponse.json({ flags })
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const body = await req.json()
    const { id, enabled } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    if (typeof enabled !== 'boolean') return NextResponse.json({ error: 'enabled must be boolean' }, { status: 400 })
    const flag = await db.featureFlag.update({ where: { id }, data: { enabled } })
    return NextResponse.json({ success: true, flag })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
