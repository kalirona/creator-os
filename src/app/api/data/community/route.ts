import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const posts = await db.communityPost.findMany({
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    include: { user: true, comments: { include: { user: true }, orderBy: { createdAt: 'asc' } } },
  })
  return NextResponse.json(posts.map((p) => ({
    id: p.id, title: p.title, content: p.content, category: p.category,
    likesCount: p.likesCount, commentsCount: p.commentsCount, isPinned: p.isPinned,
    createdAt: p.createdAt,
    author: { name: p.user.name, initials: p.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2) },
    comments: p.comments.map((c) => ({
      id: c.id, content: c.content, createdAt: c.createdAt,
      author: { name: c.user.name, initials: c.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2) },
    })),
  })))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, content, category } = body
  if (!title || !content) return NextResponse.json({ error: 'Title and content required' }, { status: 400 })
  const user = await db.user.findFirst({ orderBy: { createdAt: 'asc' } })
  const workspace = await db.workspace.findFirst()
  if (!user || !workspace) return NextResponse.json({ error: 'No user/workspace' }, { status: 400 })
  const post = await db.communityPost.create({
    data: { title, content, category: category || 'General', userId: user.id, workspaceId: workspace.id },
    include: { user: true },
  })
  return NextResponse.json({
    id: post.id, title: post.title, content: post.content, category: post.category,
    likesCount: 0, commentsCount: 0, isPinned: false, createdAt: post.createdAt,
    author: { name: post.user.name, initials: post.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2) },
    comments: [],
  })
}
