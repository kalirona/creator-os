import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { siteSettingService } from '@/lib/services'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const ctx = await createRequestContext()
    const settings = await siteSettingService.list(ctx)
    const parsed = settings.map((s) => {
      let value: unknown = s.value
      try { if (s.value.startsWith('{') || s.value.startsWith('[')) value = JSON.parse(s.value) } catch { /* keep string */ }
      return { id: s.id, key: s.key, value, category: s.category }
    })
    return NextResponse.json({ settings: parsed })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const body = await req.json()
    const { id, value } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const val = typeof value === 'string' ? value : JSON.stringify(value)
    const setting = await db.siteSetting.update({ where: { id }, data: { value: val } })
    return NextResponse.json({ success: true, setting })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
