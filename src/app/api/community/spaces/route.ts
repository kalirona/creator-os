import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { communityService } from '@/lib/services/community'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const ctx = await createRequestContext()
    const spaces = await communityService.listSpaces(ctx)
    return NextResponse.json({ spaces })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  iconUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  color: z.string().optional(),
  privacy: z.string().optional(),
  rules: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const body = await createSchema.parse(await req.json())
    const space = await communityService.createSpace(ctx, body)
    return NextResponse.json({ success: true, space }, { status: 201 })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}