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

  const providers = await db.aiProvider.findMany({ include: { models: true }, orderBy: { priority: 'asc' } })
  const masked = providers.map((p) => ({
    ...p,
    apiKey: p.apiKey ? `${'*'.repeat(8)}${p.apiKey.slice(-4)}` : '',
  }))
  return NextResponse.json({ providers: masked })
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const allowed = ['name', 'apiKey', 'baseUrl', 'isActive', 'priority']
    const data: Record<string, unknown> = {}
    for (const k of allowed) if (k in updates) data[k] = updates[k]
    const provider = await db.aiProvider.update({ where: { id }, data })
    const masked = {
      ...provider,
      apiKey: provider.apiKey ? `${'*'.repeat(8)}${provider.apiKey.slice(-4)}` : '',
    }
    return NextResponse.json({ success: true, provider: masked })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
