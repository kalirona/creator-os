import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { MediaService } from '@/lib/media/service'
import { z } from 'zod'

const service = new MediaService()

const updateSchema = z.object({
  altText: z.string().optional(),
  caption: z.string().optional(),
  description: z.string().optional(),
  folderId: z.string().optional().nullable(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await createRequestContext()
    const { id } = await params
    const asset = await service.getAsset(ctx, id)
    return NextResponse.json(asset)
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await createRequestContext()
    const { id } = await params
    const body = await updateSchema.parse(await request.json())
    const asset = await service.updateAsset(ctx, id, { ...body, folderId: body.folderId ?? undefined })
    return NextResponse.json({ success: true, asset })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await createRequestContext()
    const { id } = await params
    await service.deleteAsset(ctx, id)
    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}