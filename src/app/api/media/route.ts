import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { MediaService } from '@/lib/media/service'
import { z } from 'zod'

const service = new MediaService()

const listSchema = z.object({
  folderId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().optional(),
  perPage: z.coerce.number().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const params = listSchema.parse(Object.fromEntries(request.nextUrl.searchParams))
    const result = await service.listAssets(ctx, params.folderId, params.search, params.page, params.perPage)
    return NextResponse.json(result)
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
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folderId = formData.get('folderId') as string | null
    const altText = (formData.get('altText') as string) || undefined

    if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const asset = await service.uploadAsset(ctx, { name: file.name, size: file.size, type: file.type, buffer }, folderId || undefined, altText)
    return NextResponse.json({ success: true, asset }, { status: 201 })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}