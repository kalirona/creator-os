import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { communityService } from '@/lib/services/community'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const notificationSchema = z.object({
  userId: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string().optional(),
  postId: z.string().optional(),
  link: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const body = await notificationSchema.parse(await req.json())
    await communityService.createNotification(ctx, body)
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}