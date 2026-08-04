import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { communityService } from '@/lib/services/community'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const feedSchema = z.object({
  spaceId: z.string().optional(),
  authorId: z.string().optional(),
  type: z.string().optional(),
  search: z.string().optional(),
  isPinned: z.string().optional(),
  perPage: z.coerce.number().optional(),
  cursor: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const params = feedSchema.parse(Object.fromEntries(req.nextUrl.searchParams))
    const result = await communityService.listPosts(ctx, {
      spaceId: params.spaceId,
      authorId: params.authorId,
      type: params.type,
      search: params.search,
      isPinned: params.isPinned === 'true',
      perPage: params.perPage,
      cursor: params.cursor,
    })
    return NextResponse.json(result)
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}