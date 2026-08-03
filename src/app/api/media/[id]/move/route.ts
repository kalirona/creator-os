import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { MediaService } from '@/lib/media/service'
import { z } from 'zod'

const service = new MediaService()

const moveSchema = z.object({ folderId: z.string().optional().nullable() })

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await createRequestContext()
    const { id } = await params
    const body = await moveSchema.parse(await request.json())
    const asset = await service.moveAsset(ctx, id, body.folderId ?? null)
    return NextResponse.json({ success: true, asset })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}