import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { db } from '@/lib/db'
import { logAuditEvent } from '@/lib/logging'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const type = req.nextUrl.searchParams.get('type')
    const where = { workspaceId: ctx.workspace.id, ...(type ? { type } : {}) }
    const pages = await db.page.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { sections: true } } },
    })
    return NextResponse.json({
      pages: pages.map((p) => ({
        id: p.id, title: p.title, slug: p.slug, type: p.type, status: p.status,
        category: p.category, visits: p.visits, conversions: p.conversions,
        sectionCount: p._count.sections, publishedAt: p.publishedAt, createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      stats: {
        total: pages.length,
        published: pages.filter((p) => p.status === 'PUBLISHED').length,
        drafts: pages.filter((p) => p.status === 'DRAFT').length,
        totalVisits: pages.reduce((s, p) => s + p.visits, 0),
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
    const { title, slug, type = 'PAGE', category = 'General' } = body
    if (!title || !slug) return NextResponse.json({ error: 'title and slug required' }, { status: 400 })

    const page = await db.page.create({
      data: {
        workspaceId: ctx.workspace.id,
        title,
        slug,
        type,
        category,
        status: 'DRAFT',
        seoTitle: title,
      },
    })

    await logAuditEvent('page.create', {
      userId: ctx.user.id,
      workspaceId: ctx.workspace.id,
      resource: 'Page',
      resourceId: page.id,
    })

    return NextResponse.json({ success: true, page })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const body = await req.json()
    const { id, title, slug, status, category, seoTitle, seoDescription, ogImage } = body
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const existing = await db.page.findFirst({ where: { id, workspaceId: ctx.workspace.id } })
    if (!existing) return NextResponse.json({ error: 'Page not found' }, { status: 404 })

    const data: Record<string, unknown> = {}
    if (title !== undefined) data.title = title
    if (slug !== undefined) data.slug = slug
    if (category !== undefined) data.category = category
    if (seoTitle !== undefined) data.seoTitle = seoTitle
    if (seoDescription !== undefined) data.seoDescription = seoDescription
    if (ogImage !== undefined) data.ogImage = ogImage
    if (status !== undefined) {
      data.status = status
      if (status === 'PUBLISHED') {
        data.publishedAt = existing.publishedAt ?? new Date()
        data.scheduledAt = null
      }
    }

    const page = await db.page.update({ where: { id }, data })

    await logAuditEvent('page.update', {
      userId: ctx.user.id,
      workspaceId: ctx.workspace.id,
      resource: 'Page',
      resourceId: page.id,
      metadata: { changes: data },
    })

    return NextResponse.json({ success: true, page })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const page = await db.page.findFirst({ where: { id, workspaceId: ctx.workspace.id } })
    if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })

    await db.page.delete({ where: { id } })
    await logAuditEvent('page.delete', {
      userId: ctx.user.id,
      workspaceId: ctx.workspace.id,
      resource: 'Page',
      resourceId: id,
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
