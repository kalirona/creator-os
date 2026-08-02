import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { db } from '@/lib/db'
import { logAuditEvent } from '@/lib/logging'

export const dynamic = 'force-dynamic'

function normalizeDomain(input: string) {
  return input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '')
}

export async function GET() {
  try {
    const ctx = await createRequestContext()
    const domains = await db.customDomain.findMany({
      where: { workspaceId: ctx.workspace.id },
      orderBy: { createdAt: 'desc' },
      include: { funnel: { select: { id: true, name: true, slug: true } } },
    })
    return NextResponse.json({
      domains: domains.map((d) => ({ id: d.id, domain: d.domain, status: d.status, funnel: d.funnel, createdAt: d.createdAt })),
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
    const { domain, funnelId } = body as { domain?: string; funnelId?: string | null }

    const clean = normalizeDomain(domain || '')
    if (!clean) return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(clean)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
    }

    if (funnelId) {
      const funnel = await db.funnel.findFirst({ where: { id: funnelId, workspaceId: ctx.workspace.id } })
      if (!funnel) return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })
    }

    const existing = await db.customDomain.findUnique({ where: { domain: clean } })
    if (existing) return NextResponse.json({ error: 'That domain is already connected to another account' }, { status: 409 })

    const cd = await db.customDomain.create({
      data: { workspaceId: ctx.workspace.id, domain: clean, funnelId: funnelId || null, status: 'PENDING' },
    })

    await logAuditEvent('domain.connect', {
      userId: ctx.user.id,
      workspaceId: ctx.workspace.id,
      resource: 'CustomDomain',
      resourceId: cd.id,
    })

    return NextResponse.json({ success: true, domain: { id: cd.id, domain: cd.domain, status: cd.status } })
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
    const { id, funnelId, status } = body as { id?: string; funnelId?: string | null; status?: string }

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    const existing = await db.customDomain.findFirst({ where: { id, workspaceId: ctx.workspace.id } })
    if (!existing) return NextResponse.json({ error: 'Domain not found' }, { status: 404 })

    const data: Record<string, unknown> = {}
    if (funnelId !== undefined) data.funnelId = funnelId || null
    if (status !== undefined) data.status = status

    const cd = await db.customDomain.update({ where: { id }, data })
    return NextResponse.json({ success: true, domain: { id: cd.id, status: cd.status, funnelId: cd.funnelId } })
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
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const existing = await db.customDomain.findFirst({ where: { id, workspaceId: ctx.workspace.id } })
    if (!existing) return NextResponse.json({ error: 'Domain not found' }, { status: 404 })

    await db.customDomain.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
