import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { communityService } from '@/lib/services/community'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const reportSchema = z.object({
  postId: z.string().optional(),
  commentId: z.string().optional(),
  reason: z.string(),
  description: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const body = await reportSchema.parse(await req.json())
    const report = await communityService.createReport(ctx, body)
    return NextResponse.json({ success: true, report }, { status: 201 })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}