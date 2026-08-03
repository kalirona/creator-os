import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { MediaService } from '@/lib/media/service'

const service = new MediaService()

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await createRequestContext()
    const { id } = await params
    const usages = await service.getUsage(ctx, id)
    return NextResponse.json({ usages })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}