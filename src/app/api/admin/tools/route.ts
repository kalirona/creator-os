import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createRequestContext } from '@/lib/context'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const ctx = await createRequestContext()
  if (ctx.user.role !== 'ADMIN' && ctx.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

// GET all tools (including hidden) for admin
export async function GET() {
  const authError = await requireAdmin()
  if (authError) return authError

  const tools = await db.aiTool.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] })
  const generations = await db.aiGeneration.count()
  const totalCreditsUsed = await db.creditTransaction.aggregate({ where: { amount: { lt: 0 } }, _sum: { amount: true } })
  return NextResponse.json({
    tools: tools.map((t) => ({ ...t, generationCount: 0 })),
    stats: {
      total: tools.length,
      visible: tools.filter((t) => t.isVisible).length,
      pro: tools.filter((t) => t.isPro).length,
      generations,
      totalCreditsUsed: Math.abs(totalCreditsUsed._sum.amount || 0),
    },
  })
}

// PUT — update a tool (Tool Builder: prompts, costs, temp, visibility, etc.)
export async function PUT(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    // Only allow safe fields
    const allowed = ['name', 'description', 'icon', 'category', 'systemPrompt', 'creditCost', 'temperature', 'maxTokens', 'outputType', 'isVisible', 'isPro']
    const data: Record<string, unknown> = {}
    for (const k of allowed) if (k in updates) data[k] = updates[k]
    const tool = await db.aiTool.update({ where: { id }, data })
    return NextResponse.json({ success: true, tool })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
