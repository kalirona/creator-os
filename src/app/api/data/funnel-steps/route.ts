import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { db } from '@/lib/db'
import { logAuditEvent } from '@/lib/logging'

export const dynamic = 'force-dynamic'

const STEP_TYPES = ['LANDING', 'CHECKOUT', 'UPSELL', 'DOWNSELL', 'THANK_YOU', 'EMAIL', 'COMMUNITY_INVITE', 'COURSE_ACCESS']

export async function GET(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const funnelId = req.nextUrl.searchParams.get('funnelId')
    if (!funnelId) return NextResponse.json({ error: 'funnelId required' }, { status: 400 })
    const funnel = await db.funnel.findFirst({ where: { id: funnelId, workspaceId: ctx.workspace.id } })
    if (!funnel) return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })
    const steps = await db.funnelStep.findMany({ where: { funnelId }, orderBy: { position: 'asc' }, include: { page: { select: { id: true, title: true, slug: true } } } })
    return NextResponse.json({
      steps: steps.map((s) => ({ id: s.id, name: s.name, type: s.type, position: s.position, isRequired: s.isRequired, pageId: s.pageId, page: s.page })),
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const body = await req.json()
    const { funnelId, name, type = 'LANDING', pageId, isRequired = true } = body as { funnelId?: string; name?: string; type?: string; pageId?: string; isRequired?: boolean }
    if (!funnelId || !name) return NextResponse.json({ error: 'funnelId and name are required' }, { status: 400 })
    if (!STEP_TYPES.includes(type)) return NextResponse.json({ error: 'Invalid step type' }, { status: 400 })

    const funnel = await db.funnel.findFirst({ where: { id: funnelId, workspaceId: ctx.workspace.id } })
    if (!funnel) return NextResponse.json({ error: 'Funnel not found' }, { status: 404 })

    if (pageId) {
      const page = await db.page.findFirst({ where: { id: pageId, workspaceId: ctx.workspace.id } })
      if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    const maxPos = await db.funnelStep.aggregate({ where: { funnelId }, _max: { position: true } })
    const step = await db.funnelStep.create({
      data: { funnelId, name: name.trim(), type, pageId: pageId || null, isRequired, position: (maxPos._max.position ?? -1) + 1 },
    })

    await logAuditEvent('funnel.update', {
      userId: ctx.user.id,
      workspaceId: ctx.workspace.id,
      resource: 'Funnel',
      resourceId: funnelId,
      metadata: { action: 'add_step', stepType: type },
    })

    return NextResponse.json({ success: true, step })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const body = await req.json()
    const { id, name, type, pageId, isRequired, action } = body as { id?: string; name?: string; type?: string; pageId?: string | null; isRequired?: boolean; action?: string }
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const step = await db.funnelStep.findFirst({ where: { id, funnel: { workspaceId: ctx.workspace.id } } })
    if (!step) return NextResponse.json({ error: 'Step not found' }, { status: 404 })

    if (action === 'reorder') {
      const order = body.order as string[] | undefined
      if (!Array.isArray(order) || order.length === 0) return NextResponse.json({ error: 'order required' }, { status: 400 })
      for (let i = 0; i < order.length; i++) {
        await db.funnelStep.updateMany({ where: { id: order[i], funnelId: step.funnelId }, data: { position: i } })
      }
      await logAuditEvent('funnel.update', {
        userId: ctx.user.id,
        workspaceId: ctx.workspace.id,
        resource: 'Funnel',
        resourceId: step.funnelId,
        metadata: { action: 'reorder_steps' },
      })
      return NextResponse.json({ success: true })
    }

    if (type && !STEP_TYPES.includes(type)) return NextResponse.json({ error: 'Invalid step type' }, { status: 400 })
    if (pageId !== undefined) {
      if (pageId === null) {
        await db.funnelStep.update({ where: { id }, data: { pageId: null } })
      } else {
        const page = await db.page.findFirst({ where: { id: pageId, workspaceId: ctx.workspace.id } })
        if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })
        await db.funnelStep.update({ where: { id }, data: { pageId } })
      }
    }
    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name.trim()
    if (type !== undefined) data.type = type
    if (isRequired !== undefined) data.isRequired = isRequired

    const updated = await db.funnelStep.update({ where: { id }, data, include: { page: { select: { id: true, title: true, slug: true } } } })

    await logAuditEvent('funnel.update', {
      userId: ctx.user.id,
      workspaceId: ctx.workspace.id,
      resource: 'Funnel',
      resourceId: step.funnelId,
      metadata: { action: 'update_step', stepId: id },
    })

    return NextResponse.json({ success: true, step: updated })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const step = await db.funnelStep.findFirst({ where: { id, funnel: { workspaceId: ctx.workspace.id } } })
    if (!step) return NextResponse.json({ error: 'Step not found' }, { status: 404 })
    await db.funnelStep.delete({ where: { id } })
    await db.funnelStep.updateMany({ where: { funnelId: step.funnelId, position: { gt: step.position } }, data: { position: { decrement: 1 } } })
    await logAuditEvent('funnel.update', {
      userId: ctx.user.id,
      workspaceId: ctx.workspace.id,
      resource: 'Funnel',
      resourceId: step.funnelId,
      metadata: { action: 'delete_step', stepId: id },
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 400 })
  }
}
