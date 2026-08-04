import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { communityService } from '@/lib/services/community'

export const dynamic = 'force-dynamic'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await createRequestContext()
    const { id } = await params
    await communityService.deleteComment(ctx, id)
    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}