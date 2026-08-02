import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { db } from '@/lib/db'
import { logAuditEvent } from '@/lib/logging'

export const dynamic = 'force-dynamic'

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'funnel'
}

async function generateSlug(base: string, workspaceId: string) {
  const desired = slugify(base)
  let slug = desired
  let n = 1
  while (await db.funnel.findFirst({ where: { slug, workspaceId } })) {
    n += 1
    slug = `${desired}-${n}`
  }
  return slug
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const id = req.nextUrl.searchParams.get('id')
    if (id) {
      const funnel = await db.funnel.findFirst({
        where: { id, workspaceId: ctx.workspace.id },
        include: { steps: { orderBy: { position: 'asc' }, include: { page: { select: { id: true, title: true, slug: true } } } }, customDomains: { orderBy: { createdAt: 'desc' } } },
      })
      if (!funnel) return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })
      return NextResponse.json({
        funnel: {
          id: funnel.id, name: funnel.name, slug: funnel.slug, description: funnel.description, type: funnel.type, status: funnel.status,
          visits: funnel.visits, conversions: funnel.conversions, revenue: funnel.revenue, createdAt: funnel.createdAt,
          steps: funnel.steps.map((s) => ({ id: s.id, name: s.name, type: s.type, position: s.position, isRequired: s.isRequired, page: s.page })),
          customDomains: funnel.customDomains.map((d) => ({ id: d.id, domain: d.domain, status: d.status })),
        },
      })
    }
    const funnels = await db.funnel.findMany({
      where: { workspaceId: ctx.workspace.id },
      orderBy: { createdAt: 'desc' },
      include: { steps: { orderBy: { position: 'asc' }, include: { page: { select: { id: true, title: true, slug: true } } } } },
    })
    return NextResponse.json({
      funnels: funnels.map((f) => ({
        id: f.id, name: f.name, slug: f.slug, description: f.description, type: f.type, status: f.status,
        visits: f.visits, conversions: f.conversions, revenue: f.revenue, createdAt: f.createdAt,
        steps: f.steps.map((s) => ({ id: s.id, name: s.name, type: s.type, position: s.position, isRequired: s.isRequired, page: s.page })),
      })),
      stats: {
        total: funnels.length,
        live: funnels.filter((f) => f.status === 'LIVE').length,
        totalVisits: funnels.reduce((s, f) => s + f.visits, 0),
        totalRevenue: funnels.reduce((s, f) => s + f.revenue, 0),
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
    const { name, description, type } = body

    if (!name || !name.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const slug = await generateSlug(name.trim(), ctx.workspace.id)

    const funnel = await db.funnel.create({
      data: {
        workspaceId: ctx.workspace.id,
        slug,
        name: name.trim(),
        description: description || '',
        type: type || 'SALES',
        status: 'DRAFT',
      },
    })

    await logAuditEvent('funnel.create', {
      userId: ctx.user.id,
      workspaceId: ctx.workspace.id,
      resource: 'Funnel',
      resourceId: funnel.id,
    })

    return NextResponse.json({ success: true, funnel: { id: funnel.id, name: funnel.name, slug: funnel.slug } })
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
    const { id, name, description, type, status } = body

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    const existing = await db.funnel.findFirst({ where: { id, workspaceId: ctx.workspace.id } })
    if (!existing) return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name.trim()
    if (description !== undefined) data.description = description
    if (type !== undefined) data.type = type
    if (status !== undefined) data.status = status

    const funnel = await db.funnel.update({ where: { id }, data })
    return NextResponse.json({ success: true, funnel: { id: funnel.id, name: funnel.name, status: funnel.status } })
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

    const existing = await db.funnel.findFirst({ where: { id, workspaceId: ctx.workspace.id } })
    if (!existing) return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })

    await db.funnel.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
