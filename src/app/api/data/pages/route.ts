import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { db } from '@/lib/db'
import { slugify } from '@/lib/utils'
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
