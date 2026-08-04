import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { communityService } from '@/lib/services/community'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const rsvpSchema = z.object({
  status: z.string(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await createRequestContext()
    const { id } = await params
    const body = await rsvpSchema.parse(await req.json())
    await communityService.rsvpEvent(ctx, id, body.status)
    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}