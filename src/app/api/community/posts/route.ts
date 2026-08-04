import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { communityService } from '@/lib/services/community'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const result = await communityService.listPosts(ctx, {
      isDraft: false,
      perPage: Number(req.nextUrl.searchParams.get('perPage') || 20),
      cursor: req.nextUrl.searchParams.get('cursor') || undefined,
      spaceId: req.nextUrl.searchParams.get('spaceId') || undefined,
      type: req.nextUrl.searchParams.get('type') || undefined,
      search: req.nextUrl.searchParams.get('search') || undefined,
    })
    return NextResponse.json(result)
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}

const createSchema = z.object({
  spaceId: z.string().optional(),
  title: z.string().optional(),
  content: z.string().min(1),
  type: z.string().default('TEXT'),
  mediaIds: z.array(z.string()).optional(),
  pollOptions: z.array(z.string()).optional(),
  isDraft: z.boolean().optional(),
  isScheduled: z.boolean().optional(),
  scheduledAt: z.string().optional().transform((v) => v ? new Date(v) : undefined),
})

export async function POST(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const body = await createSchema.parse(await req.json())
    const post = await communityService.createPost(ctx, body)
    return NextResponse.json({ success: true, post }, { status: 201 })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}