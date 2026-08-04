import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { communityService } from '@/lib/services/community'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const ctx = await createRequestContext()
    const announcements = await communityService.listAnnouncements(ctx)
    return NextResponse.json({ announcements })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
  isPinned: z.boolean().optional(),
  startsAt: z.string().optional().transform((v) => v ? new Date(v) : undefined),
  endsAt: z.string().optional().transform((v) => v ? new Date(v) : undefined),
})

export async function POST(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const body = await createSchema.parse(await req.json())
    const announcement = await communityService.createAnnouncement(ctx, body)
    return NextResponse.json({ success: true, announcement }, { status: 201 })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}