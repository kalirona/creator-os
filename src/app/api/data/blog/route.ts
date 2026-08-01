import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { blogService } from '@/lib/services'
import { db } from '@/lib/db'
import { slugify } from '@/lib/utils'
import { logAuditEvent } from '@/lib/logging'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const ctx = await createRequestContext()
    const posts = await blogService.list(ctx)
    return NextResponse.json({
      posts: posts.map((p) => ({
        id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt, content: p.content,
        category: p.category, tags: p.tags.split(',').filter(Boolean), author: p.author,
        status: p.status, coverUrl: p.coverUrl, visits: p.visits, publishedAt: p.publishedAt, createdAt: p.createdAt,
      })),
      stats: {
        total: posts.length,
        published: posts.filter((p) => p.status === 'PUBLISHED').length,
        drafts: posts.filter((p) => p.status === 'DRAFT').length,
        totalVisits: posts.reduce((s, p) => s + p.visits, 0),
      },
    })
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
    const { title, slug, excerpt, content, category, tags, status, coverUrl } = body

    if (!title || !title.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

    const postSlug = (slug?.trim() || slugify(title)) + '-' + Date.now().toString(36)
    const post = await db.blogPost.create({
      data: {
        workspaceId: ctx.workspace.id,
        title: title.trim(),
        slug: postSlug,
        excerpt: excerpt || '',
        content: content || '',
        category: category || 'General',
        tags: Array.isArray(tags) ? tags.join(',') : (tags || ''),
        author: 'Creator',
        status: status || 'DRAFT',
        coverUrl: coverUrl || undefined,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
      },
    })

    await logAuditEvent('blog_post.create', {
      userId: ctx.user.id,
      workspaceId: ctx.workspace.id,
      resource: 'BlogPost',
      resourceId: post.id,
    })

    return NextResponse.json({ success: true, post: { id: post.id, slug: post.slug, title: post.title, status: post.status } })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const body = await req.json()
    const { id, title, slug, excerpt, content, category, tags, status, coverUrl } = body

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    const existing = await db.blogPost.findFirst({ where: { id, workspaceId: ctx.workspace.id } })
    if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    const data: Record<string, unknown> = {}
    if (title !== undefined) data.title = title.trim()
    if (slug !== undefined) data.slug = slug.trim()
    if (excerpt !== undefined) data.excerpt = excerpt
    if (content !== undefined) data.content = content
    if (category !== undefined) data.category = category
    if (tags !== undefined) data.tags = Array.isArray(tags) ? tags.join(',') : tags
    if (coverUrl !== undefined) data.coverUrl = coverUrl || null
    if (status !== undefined) {
      data.status = status
      if (status === 'PUBLISHED' && !existing.publishedAt) data.publishedAt = new Date()
      if (status === 'DRAFT') data.publishedAt = null
    }

    const post = await db.blogPost.update({ where: { id }, data })
    return NextResponse.json({ success: true, post: { id: post.id, title: post.title, status: post.status } })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const existing = await db.blogPost.findFirst({ where: { id, workspaceId: ctx.workspace.id } })
    if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    await db.blogPost.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
