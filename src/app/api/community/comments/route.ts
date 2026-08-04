import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { communityService } from '@/lib/services/community'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const commentSchema = z.object({
  postId: z.string(),
  parentId: z.string().optional(),
  content: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const body = await commentSchema.parse(await req.json())
    const comment = await communityService.createComment(ctx, body)
    return NextResponse.json({ success: true, comment }, { status: 201 })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}