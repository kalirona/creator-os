import { NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const ctx = await createRequestContext()
    const { db } = await import('@/lib/db')
    const community = await db.community.findFirst({
      where: { workspaceId: ctx.workspace.id },
      include: {
        members: {
          orderBy: [{ reputation: 'desc' }, { points: 'desc' }, { joinedAt: 'asc' }],
          include: { user: true },
          take: 100,
        },
      },
    })
    if (!community) return NextResponse.json({ leaderboard: [] })

    const leaderboard = community.members.map((m, index) => ({
      rank: index + 1,
      userId: m.userId,
      name: m.user.name,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      reputation: m.reputation,
      points: m.points,
      level: m.level,
      postsCount: 0,
      commentsCount: 0,
    }))

    return NextResponse.json({ leaderboard })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}