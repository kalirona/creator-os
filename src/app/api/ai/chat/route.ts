import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { createRequestContext } from '@/lib/context'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface ChatMessage { role: 'user' | 'assistant'; content: string }

const TOOL_SYSTEM_PROMPTS: Record<string, string> = {
  CHAT: 'You are CreatorOS AI, an expert business assistant for digital creators, course creators, and online entrepreneurs. You give concise, actionable, and specific advice. Use Markdown formatting with headings, bullet points, and bold where helpful. Be encouraging but direct.',
  COURSE: 'You are CreatorOS Course Architect AI. You design complete, sellable online courses. Always respond with a structured course outline in Markdown: course title, target student, outcome promise, then numbered modules each with 3-5 lessons (lesson title + 1-line objective). End with a pricing recommendation.',
  LESSON: 'You are CreatorOS Lesson Writer AI. You write engaging, well-structured single lessons. Respond in Markdown: lesson title, learning objective, a hook, the main content with clear sections, an actionable exercise, and a summary. Keep it practical and skimmable.',
  EMAIL: 'You are CreatorOS Email Copywriter AI, trained on 7-figure creator email strategies. Write high-converting emails. Respond in Markdown with: subject line (3 options), preview text, and the full email body. Use short paragraphs, one core idea, and a single clear CTA.',
  SALES: 'You are CreatorOS Sales Page AI. You write long-form sales pages using proven frameworks (PAS, AIDA). Respond in Markdown with: headline, subheadline, the problem, the solution, features to benefits, social proof placeholders, pricing anchor, FAQ (3 Qs), and a final CTA.',
  BLOG: 'You are CreatorOS Blog Writer AI. You write SEO-friendly, reader-focused blog posts. Respond in Markdown with: H1 title, a meta description line, an engaging intro, 3-5 H2 sections with substantive content, and a conclusion with CTA.',
  SOCIAL: 'You are CreatorOS Social Media AI. You create platform-native content that drives engagement. Respond in Markdown with 3 distinct post variations for the requested platform, each with a hook, body, and CTA. Include 5 relevant hashtags.',
  SCRIPT: 'You are CreatorOS YouTube Script AI. You write retention-optimized video scripts. Respond in Markdown with: video title (3 options), a 0-15s hook, the full script with visual cues in [brackets], a mid-video pattern interrupt, and a CTA outro.',
  PRODUCT: 'You are CreatorOS Product Strategist AI. You ideate and position digital products. Respond in Markdown with: product name (3 options), the target buyer, the core transformation, a feature list, a positioning statement, and a launch plan (3 steps).',
  LANDING: 'You are CreatorOS Landing Page AI. You write high-converting landing page copy. Respond in Markdown with: hero headline + subhead, 3 benefit blocks, social proof section, feature list, pricing, FAQ (3), and final CTA.',
}

const CREDIT_COSTS: Record<string, number> = {
  CHAT: 2, LESSON: 5, EMAIL: 4, SOCIAL: 3, BLOG: 8, SCRIPT: 10, PRODUCT: 6, LANDING: 7, COURSE: 15, SALES: 12,
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const body = await req.json()
    const { tool = 'CHAT', messages = [] } = body as { tool?: string; messages?: ChatMessage[] }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 })
    }

    const systemPrompt = TOOL_SYSTEM_PROMPTS[tool] || TOOL_SYSTEM_PROMPTS.CHAT
    const cost = CREDIT_COSTS[tool] || 2

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      thinking: { type: 'disabled' },
    })

    const content = completion.choices[0]?.message?.content || ''

    try {
      if (ctx.user.credits >= cost) {
        await db.user.update({ where: { id: ctx.user.id }, data: { credits: { decrement: cost } } })
        await db.creditTransaction.create({
          data: { userId: ctx.user.id, amount: -cost, reason: `AI ${tool}` },
        })
      }
    } catch {
      // ignore
    }

    return NextResponse.json({ content, creditsUsed: cost, model: 'zai-glm' })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('AI chat error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'AI request failed' },
      { status: 500 }
    )
  }
}
