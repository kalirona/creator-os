import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { communityService } from '@/lib/services'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const ctx = await createRequestContext()
    const result = await communityService.listPosts(ctx)
    return NextResponse.json(result.posts)
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const body = await req.json()
    const post = await communityService.createPost(ctx, {
      title: body.title,
      content: body.content,
      type: body.category || 'TEXT',
    })
    return NextResponse.json({
      id: post.id,
      title: post.title ?? '',
      content: post.content,
      category: body.category || 'General',
      likesCount: 0,
      commentsCount: 0,
      isPinned: false,
      createdAt: post.createdAt,
      author: { name: ctx.user.name, initials: ctx.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2) },
      comments: [],
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
