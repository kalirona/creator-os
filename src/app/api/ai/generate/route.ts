import { NextRequest, NextResponse } from 'next/server'
import { callAi } from '@/lib/ai/client'
import { createRequestContext } from '@/lib/context'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function parseStructured(raw: string): { ok: boolean; data: unknown } {
  let text = raw.trim()
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) return { ok: false, data: null }
  const slice = text.slice(start, end + 1)
  try {
    return { ok: true, data: JSON.parse(slice) }
  } catch {
    return { ok: false, data: null }
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const body = await req.json()
    const { toolSlug, input } = body as { toolSlug?: string; input?: string }

    if (!toolSlug || !input?.trim()) {
      return NextResponse.json({ error: 'toolSlug and input are required' }, { status: 400 })
    }

    const tool = await db.aiTool.findUnique({ where: { slug: toolSlug } })
    if (!tool) return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
    if (!tool.isVisible) return NextResponse.json({ error: 'This tool is currently disabled' }, { status: 403 })

    const model = await db.aiModel.findFirst({ where: { isActive: true, isDefault: true }, include: { provider: true } })
    if (!model) return NextResponse.json({ error: 'No active AI model configured. Contact your admin.' }, { status: 503 })

    const user = ctx.user
    if (user.credits < tool.creditCost) {
      return NextResponse.json({ error: `Insufficient credits. This tool requires ${tool.creditCost} credits. You have ${user.credits}.` }, { status: 402 })
    }

    const messages = [
      { role: 'system' as const, content: tool.systemPrompt },
      { role: 'user' as const, content: input },
    ]

    const rawOutput = await callAi(messages, { temperature: tool.temperature, maxTokens: tool.maxTokens })

    const isStructured = tool.outputType !== 'MARKDOWN'
    let structured: Record<string, unknown> = {}
    if (isStructured) {
      const parsed = parseStructured(rawOutput)
      structured = parsed.ok ? parsed.data as Record<string, unknown> : { _parseError: true, _raw: rawOutput.slice(0, 500) }
    }

    const generation = await db.aiGeneration.create({
      data: {
        userId: user.id,
        toolId: tool.id,
        toolSlug: tool.slug,
        title: input.slice(0, 80),
        input,
        output: rawOutput,
        structured: JSON.stringify(structured),
        status: 'COMPLETED',
        creditsUsed: tool.creditCost,
      },
    })

    await db.user.update({ where: { id: user.id }, data: { credits: { decrement: tool.creditCost } } })
    await db.creditTransaction.create({ data: { userId: user.id, amount: -tool.creditCost, reason: `AI: ${tool.name}` } })

    return NextResponse.json({
      generationId: generation.id,
      toolSlug: tool.slug,
      toolName: tool.name,
      outputType: tool.outputType,
      raw: rawOutput,
      structured,
      creditsUsed: tool.creditCost,
      remainingCredits: user.credits - tool.creditCost,
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('AI generate error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'AI generation failed' }, { status: 500 })
  }
}

export async function GET() {
  try {
    await createRequestContext()
    const tools = await db.aiTool.findMany({
    where: { isVisible: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    select: { id: true, slug: true, name: true, description: true, icon: true, category: true, creditCost: true, outputType: true, isPro: true },
  })
  return NextResponse.json({ tools })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
