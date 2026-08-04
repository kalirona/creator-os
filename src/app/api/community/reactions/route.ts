import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { communityService } from '@/lib/services/community'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const reactionSchema = z.object({
  postId: z.string().optional(),
  commentId: z.string().optional(),
  type: z.string(),
})

export async function POST(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const body = await reactionSchema.parse(await req.json())
    await communityService.addReaction(ctx, body)
    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const postId = req.nextUrl.searchParams.get('postId')
    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })
    const counts = await communityService.getReactionCounts(ctx, postId)
    return NextResponse.json(counts)
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}