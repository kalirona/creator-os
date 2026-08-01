import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createRequestContext } from '@/lib/context'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const ctx = await createRequestContext()
  if (ctx.user.role !== 'ADMIN' && ctx.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function GET() {
  const authError = await requireAdmin()
  if (authError) return authError

  const settings = await db.adminSetting.findMany({ orderBy: [{ category: 'asc' }, { key: 'asc' }] })
  return NextResponse.json({ settings })
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const body = await req.json()
    const { id, value } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    if (value === undefined) return NextResponse.json({ error: 'value required' }, { status: 400 })
    const setting = await db.adminSetting.update({ where: { id }, data: { value: String(value) } })
    return NextResponse.json({ success: true, setting })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
