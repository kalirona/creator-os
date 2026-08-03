import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { MediaService } from '@/lib/media/service'

const service = new MediaService()

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await createRequestContext()
    const { id } = await params
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const asset = await service.replaceAsset(ctx, id, { name: file.name, size: file.size, type: file.type, buffer })
    return NextResponse.json({ success: true, asset })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}