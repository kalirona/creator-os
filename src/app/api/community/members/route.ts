import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { communityService } from '@/lib/services/community'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const params = Object.fromEntries(req.nextUrl.searchParams)
    const members = await communityService.listMembers(ctx, {
      search: params.search,
      role: params.role,
      status: params.status,
      sortBy: params.sortBy as any,
      perPage: params.perPage ? Number(params.perPage) : 50,
    })
    return NextResponse.json({ members })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const body = await req.json()
    const { id, ...data } = body
    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }
    const member = await communityService.updateMember(ctx, id, data)
    return NextResponse.json({ success: true, member })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
