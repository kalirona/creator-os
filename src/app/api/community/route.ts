import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { communityService } from '@/lib/services/community'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const ctx = await createRequestContext()
    const community = await communityService.getCommunity(ctx)
    return NextResponse.json(community)
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}

const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  bio: z.string().optional(),
  iconUrl: z.string().nullable().optional(),
  bannerUrl: z.string().nullable().optional(),
  privacy: z.string().optional(),
  memberApproval: z.string().optional(),
  allowPosting: z.string().optional(),
  allowMedia: z.boolean().optional(),
  allowComments: z.boolean().optional(),
  allowReactions: z.boolean().optional(),
  allowInvites: z.boolean().optional(),
  color: z.string().optional(),
})

export async function PUT(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const body = await updateSchema.parse(await req.json())
    const community = await communityService.updateCommunity(ctx, body)
    return NextResponse.json({ success: true, community })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}