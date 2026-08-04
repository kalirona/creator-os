import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { communityService } from '@/lib/services/community'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const upcoming = req.nextUrl.searchParams.get('upcoming') === 'true'
    const events = await communityService.listEvents(ctx, { upcoming })
    return NextResponse.json({ events })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}

const createSchema = z.object({
  spaceId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().default(''),
  location: z.string().default(''),
  meetingUrl: z.string().optional(),
  startsAt: z.string().transform((v) => new Date(v)),
  endsAt: z.string().transform((v) => new Date(v)),
  type: z.string().default('MEETUP'),
  maxAttendees: z.number().optional(),
  waitlistEnabled: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const body = await createSchema.parse(await req.json())
    const event = await communityService.createEvent(ctx, body)
    return NextResponse.json({ success: true, event }, { status: 201 })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}