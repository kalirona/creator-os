import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { createRequestContext } from '@/lib/context'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ACTION_PROMPTS: Record<string, string> = {
  REWRITE: 'Rewrite the following content to be clearer and more compelling. Keep the same JSON structure and keys. Respond with ONLY the JSON.',
  IMPROVE: 'Improve the following content to be more persuasive, specific, and conversion-focused. Keep the same JSON structure and keys. Respond with ONLY the JSON.',
  SHORTEN: 'Shorten the following content to be more concise while keeping the key message. Keep the same JSON structure and keys. Respond with ONLY the JSON.',
  EXPAND: 'Expand the following content with more detail, specificity, and persuasive language. Keep the same JSON structure and keys. Respond with ONLY the JSON.',
  TRANSLATE: 'Translate all text values in the following JSON content to Spanish. Keep the same JSON structure and keys. Respond with ONLY the JSON.',
  SEO: 'Optimize the following content for SEO. Make headlines more search-friendly, add relevant keywords naturally, and improve meta descriptions if present. Keep the same JSON structure and keys. Respond with ONLY the JSON.',
}

function parseJSON(raw: string): Record<string, unknown> | null {
  let text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) return null
  try { return JSON.parse(text.slice(start, end + 1)) } catch { return null }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const body = await req.json()
    const { action, content, sectionType } = body as { action?: string; content?: Record<string, unknown>; sectionType?: string }
    if (!action || !content) return NextResponse.json({ error: 'action and content required' }, { status: 400 })
    const instruction = ACTION_PROMPTS[action]
    if (!instruction) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    const user = ctx.user
    const cost = 2
    if (user.credits < cost) return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: `You are an expert copywriter for creator businesses. You improve ${sectionType || 'page'} section content. ${instruction}` },
        { role: 'user', content: JSON.stringify(content, null, 2) },
      ],
      thinking: { type: 'disabled' },
    })
    const raw = completion.choices[0]?.message?.content || ''
    const newContent = parseJSON(raw)
    if (!newContent) return NextResponse.json({ error: 'AI failed to produce valid content. Please try again.' }, { status: 502 })

    await db.user.update({ where: { id: user.id }, data: { credits: { decrement: cost } } })
    await db.creditTransaction.create({ data: { userId: user.id, amount: -cost, reason: `AI section ${action}` } })

    return NextResponse.json({ success: true, content: newContent, creditsUsed: cost, remainingCredits: user.credits - cost })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('Section rewrite error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
