import { NextRequest, NextResponse } from 'next/server'
import { callAi } from '@/lib/ai/client'
import { createRequestContext } from '@/lib/context'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface FunnelSection { type: string; content: Record<string, unknown> }
interface FunnelStepData {
  type: string
  name: string
  pageTitle?: string
  sections?: FunnelSection[]
}
interface FunnelData {
  name: string
  description?: string
  steps: FunnelStepData[]
}

function parseStructured(raw: string): FunnelData | null {
  let text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) return null
  try { return JSON.parse(text.slice(start, end + 1)) as FunnelData } catch { return null }
}

const SYSTEM_PROMPT = `You are CreatorOS Funnel AI, an expert at building high-converting sales funnels for digital products, courses, memberships, and communities.

Generate a COMPLETE sales funnel as a single JSON object. Respond with ONLY the JSON (no markdown, no commentary).

The JSON shape must be:
{
  "name": "funnel name (short, memorable)",
  "description": "one line describing the offer",
  "steps": [
    { "type": "LANDING", "name": "step name", "pageTitle": "page title", "sections": [ ...landing page sections... ] },
    { "type": "CHECKOUT", "name": "Checkout", "pageTitle": "Checkout" },
    { "type": "UPSELL", "name": "Upsell", "pageTitle": "page title", "sections": [ ...upsell sections... ] },
    { "type": "THANK_YOU", "name": "Thank You", "pageTitle": "Thank You", "sections": [ ...thank you sections... ] }
  ]
}

Each "sections" array uses these section types:
- { "type": "HERO", "content": { "headline": "string", "subheadline": "string", "ctaText": "string", "ctaSecondary": "string", "emoji": "string" } }
- { "type": "BENEFITS", "content": { "heading": "string", "items": [ { "title": "string", "description": "string" } ] } }
- { "type": "FEATURES", "content": { "heading": "string", "subheading": "string", "items": [ { "icon": "emoji", "title": "string", "description": "string" } ] } }
- { "type": "TESTIMONIALS", "content": { "heading": "string", "items": [ { "name": "string", "role": "string", "quote": "string" } ] } }
- { "type": "PRICING", "content": { "heading": "string", "plans": [ { "name": "string", "price": number, "interval": "string", "features": ["string"], "cta": "string", "highlighted": boolean } ] } }
- { "type": "FAQ", "content": { "heading": "string", "items": [ { "question": "string", "answer": "string" } ] } }
- { "type": "CTA", "content": { "headline": "string", "subtext": "string", "ctaText": "string" } }

Rules:
- Include exactly 4 steps in this order: LANDING, CHECKOUT, UPSELL, THANK_YOU
- LANDING: 6 sections (HERO, BENEFITS, FEATURES, TESTIMONIALS, PRICING, FAQ) plus a final CTA
- UPSELL: 3 sections (HERO, FEATURES, CTA) selling a premium upsell version of the offer
- THANK_YOU: 2 sections (HERO with a "You're in!" message, and a CTA to join the community or start)
- CHECKOUT has NO sections (empty)
- Make all copy specific to what the user is selling, benefit-driven and conversion-focused
- Use emojis sparingly but effectively`

export async function POST(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const body = await req.json()
    const { selling, category } = body as { selling?: string; category?: string }
    if (!selling?.trim()) return NextResponse.json({ error: 'What are you selling? is required' }, { status: 400 })

    const tool = await db.aiTool.findUnique({ where: { slug: 'FUNNEL_GENERATOR' } })
    if (!tool) return NextResponse.json({ error: 'Funnel tool not configured' }, { status: 404 })

    const user = ctx.user
    if (user.credits < tool.creditCost) return NextResponse.json({ error: `Insufficient credits (${tool.creditCost} required, ${user.credits} available)` }, { status: 402 })

    const raw = await callAi(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `What I'm selling: ${selling}\nCategory: ${category || 'General'}` },
      ],
      { temperature: 0.7, maxTokens: 4000 }
    )
    const data = parseStructured(raw)
    if (!data || !Array.isArray(data.steps) || data.steps.length === 0) {
      return NextResponse.json({ error: 'AI failed to generate valid funnel. Please try again.' }, { status: 502 })
    }

    const funnel = await db.funnel.create({
      data: {
        workspaceId: ctx.workspace.id,
        slug: `funnel-${Date.now().toString(36)}-${ctx.workspace.id.slice(-4)}`,
        name: (data.name || selling).slice(0, 80),
        description: (data.description || `Generated funnel for ${selling}`).slice(0, 300),
        type: 'SALES',
        status: 'DRAFT',
      },
    })

    const stepTypes = ['LANDING', 'CHECKOUT', 'UPSELL', 'THANK_YOU']
    const pages: { stepType: string; pageId: string; slug: string }[] = []

    for (let i = 0; i < data.steps.length; i++) {
      const step = data.steps[i]
      const type = stepTypes.includes(step.type) ? step.type : 'LANDING'
      let pageId: string | null = null

      if (type !== 'CHECKOUT') {
        const pageTitle = (step.pageTitle || `${step.name} - ${data.name}`).slice(0, 80)
        const slug = `funnel-step-${funnel.id.slice(-6)}-${i + 1}`
        const page = await db.page.create({
          data: {
            workspaceId: ctx.workspace.id,
            title: pageTitle,
            slug,
            type: type === 'THANK_YOU' ? 'THANK_YOU' : 'FUNNEL_STEP',
            category: category || 'General',
            funnelId: funnel.id,
            status: 'DRAFT',
            seoTitle: pageTitle,
            seoDescription: data.description || '',
            schema: JSON.stringify({ '@type': 'WebPage', name: pageTitle }),
          },
        })
        pageId = page.id
        pages.push({ stepType: type, pageId, slug })

        const sections = Array.isArray(step.sections) ? step.sections : []
        for (let s = 0; s < sections.length; s++) {
          await db.pageSection.create({
            data: { pageId: page.id, type: sections[s].type, content: JSON.stringify(sections[s].content || {}), position: s },
          })
        }
      }

      await db.funnelStep.create({
        data: { funnelId: funnel.id, pageId, name: (step.name || type).slice(0, 80), type, position: i, isRequired: true },
      })
    }

    await db.user.update({ where: { id: user.id }, data: { credits: { decrement: tool.creditCost } } })
    await db.creditTransaction.create({ data: { userId: user.id, amount: -tool.creditCost, reason: 'AI Funnel' } })

    await db.aiGeneration.create({
      data: { userId: user.id, toolId: tool.id, toolSlug: tool.slug, title: funnel.name, input: selling, output: raw, structured: JSON.stringify(data), status: 'COMPLETED', creditsUsed: tool.creditCost },
    })

    return NextResponse.json({
      success: true,
      funnelId: funnel.id,
      funnelName: funnel.name,
      pages,
      creditsUsed: tool.creditCost,
      remainingCredits: user.credits - tool.creditCost,
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('AI funnel error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}
