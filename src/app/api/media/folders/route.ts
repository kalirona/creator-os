import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { MediaService } from '@/lib/media/service'
import { z } from 'zod'

const service = new MediaService()

const folderSchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const parentId = request.nextUrl.searchParams.get('parentId') || undefined
    const folders = await service.listFolders(ctx, parentId)
    return NextResponse.json({ folders })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const body = await folderSchema.parse(await request.json())
    const folder = await service.createFolder(ctx, body.name, body.parentId ?? undefined)
    return NextResponse.json({ success: true, folder }, { status: 201 })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}