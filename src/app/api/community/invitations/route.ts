import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { communityService } from '@/lib/services/community'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.string().optional(),
  spaceId: z.string().optional(),
})

export async function GET() {
  try {
    const ctx = await createRequestContext()
    const invitations = await communityService.listInvitations(ctx)
    return NextResponse.json({ invitations })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const body = await inviteSchema.parse(await req.json())
    const invitation = await communityService.createInvitation(ctx, body)
    return NextResponse.json({ success: true, invitation }, { status: 201 })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}