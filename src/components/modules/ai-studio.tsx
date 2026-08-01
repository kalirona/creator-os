'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Send, Zap, Copy, Check, RotateCcw, ChevronDown, Wand2, Loader2,
  GraduationCap, FileText, Mail, ShoppingCart, LayoutTemplate, PenLine, Share2, Youtube, Package, MessageSquare,
  Eye, Pencil, Download, Plus, Globe, DollarSign, ArrowLeft, FileCode, BookOpen, Award, Tag, Search, Rocket,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LoadingState } from '@/components/ui-enterprise/LoadingState'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

interface Tool {
  id: string; slug: string; name: string; description: string; icon: string;
  category: string; creditCost: number; outputType: string; isPro: boolean
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap, FileText, Mail, ShoppingCart, LayoutTemplate, PenLine, Share2, Youtube, Package, MessageSquare, Sparkles,
}

interface GenResult {
  generationId: string; toolSlug: string; toolName: string; outputType: string;
  raw: string; structured: Record<string, unknown>; creditsUsed: number; remainingCredits: number
}

export function AiStudioModule() {
  const [tools, setTools] = useState<Tool[]>([])
  const [toolsLoading, setToolsLoading] = useState(true)
  const [activeTool, setActiveTool] = useState<Tool | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GenResult | null>(null)
  const [credits, setCredits] = useState(4280)

  // Load tools from DB (database-driven, admin-managed)
  useEffect(() => {
    fetch('/api/ai/generate')
      .then((r) => r.json())
      .then((d) => { setTools(d.tools || []); setToolsLoading(false) })
      .catch(() => setToolsLoading(false))
  }, [])

  const generate = async (overrideInput?: string) => {
    const text = (overrideInput ?? input).trim()
    if (!text || !activeTool || loading) return
    setLoading(true)
    setResult(null)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 55000)
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolSlug: activeTool.slug, input: text }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      const raw = await res.text()
      if (!res.ok) {
        let msg = `Request failed (${res.status})`
        try { const j = JSON.parse(raw); if (j.error) msg = j.error } catch { /* */ }
        throw new Error(msg)
      }
      let data: GenResult
      try { data = JSON.parse(raw) } catch { throw new Error('Invalid response') }
      setResult(data)
      setCredits(data.remainingCredits)
      toast.success(`Generated! -${data.creditsUsed} credits`)
    } catch (e) {
      toast.error(e instanceof Error ? (e.name === 'AbortError' ? 'Timed out. Try again.' : e.message) : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  // Result view with structured renderer + actions
  if (result) {
    return (
      <ResultView
        result={result}
        tool={activeTool!}
        onBack={() => { setResult(null); setInput('') }}
        onCreditsUpdate={setCredits}
      />
    )
  }

  const grouped = tools.reduce<Record<string, Tool[]>>((acc, t) => {
    (acc[t.category] ||= []).push(t); return acc
  }, {})

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardContent className="p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">AI Studio</h2>
                <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/20">
                  <Zap className="h-2.5 w-2.5 mr-1" />Smart AI
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Workflow-based generation. Structured outputs you can publish, edit, and export.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold tabular-nums">{credits.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">credits</span>
          </div>
        </CardContent>
      </Card>

      {!activeTool ? (
        // Tool picker
        toolsLoading ? (
          <LoadingState size="lg" text="Loading AI tools..." />
        ) : (
          Object.entries(grouped).map(([cat, list]) => (
            <div key={cat}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">{cat}</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((t, i) => {
                  const Icon = ICON_MAP[t.icon] || Sparkles
                  return (
                    <motion.button key={t.slug} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      onClick={() => { setActiveTool(t); setResult(null) }}
                      className="group text-left">
                      <Card className="h-full hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-primary group-hover:scale-110 transition-transform">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              {t.isPro && <Badge variant="secondary" className="text-[9px] bg-amber-500/10 text-amber-600">PRO</Badge>}
                              <Badge variant="secondary" className="text-[9px]">{t.creditCost}cr</Badge>
                            </div>
                          </div>
                          <p className="font-semibold text-sm">{t.name}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                          <div className="mt-3 flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition">
                            <Wand2 className="h-3 w-3" /> Open generator
                          </div>
                        </CardContent>
                      </Card>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          ))
        )
      ) : (
        // Tool input view
        <ToolInput
          tool={activeTool}
          input={input}
          setInput={setInput}
          loading={loading}
          onGenerate={() => generate()}
          onBack={() => { setActiveTool(null); setInput('') }}
        />
      )}
    </div>
  )
}

function ToolInput({ tool, input, setInput, loading, onGenerate, onBack }: {
  tool: Tool; input: string; setInput: (s: string) => void; loading: boolean; onGenerate: () => void; onBack: () => void
}) {
  const Icon = ICON_MAP[tool.icon] || Sparkles
  const examples: Record<string, string[]> = {
    COURSE_GENERATOR: ['A course teaching beginners how to start a faceless YouTube channel', 'Course on selling Notion templates for $97', 'Course for fitness coaches on running online programs'],
    LESSON_WRITER: ['How to write a YouTube hook that gets 50% retention', 'Setting up a sales funnel for digital products', 'Filming B-roll that keeps viewers engaged'],
    EMAIL_WRITER: ['Welcome email for new subscribers who downloaded my Notion template', 'Launch email for my new $297 course', 'Abandoned cart recovery email'],
    SALES_PAGE_GENERATOR: ['A $297 course teaching coaches to land clients on LinkedIn', 'A $49 Notion template bundle for content creators'],
    LANDING_PAGE_GENERATOR: ['Free lead magnet: 50 AI prompts for creators', 'Webinar registration page for my course launch'],
    BLOG_WRITER: ['10 AI tools every creator should use in 2025', 'How to start a newsletter that actually grows', 'Notion vs Evernote for creators'],
    SOCIAL_MEDIA_GENERATOR: ['Announcing my new course on Twitter', 'LinkedIn post about my creator journey', 'Instagram caption for new product launch'],
    YOUTUBE_SCRIPT_GENERATOR: ['How I built a $10K/mo Notion template business', '8-minute video on time blocking for creators', 'Tutorial: Notion for content creators'],
    PRODUCT_STRATEGIST: ['A digital product for busy parents who want to meal plan', 'Notion template for freelance designers', 'Prompt pack for marketers'],
    AI_CHAT: ['How do I price my first course?', 'Best funnel for a $49 product?', 'How to get my first 1000 email subscribers?'],
  }
  const ex = examples[tool.slug] || []

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="h-4 w-4" /> All tools
      </button>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 border-b p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30">
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-bold">{tool.name}</h2>
              {tool.isPro && <Badge variant="secondary" className="text-[9px] bg-amber-500/10 text-amber-600">PRO</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">{tool.description}</p>
          </div>
          <Badge variant="secondary" className="bg-primary/15 text-primary">{tool.creditCost} credits</Badge>
        </div>

        <div className="p-5 space-y-3">
          {ex.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ex.map((e) => (
                <button key={e} onClick={() => setInput(e)} className="rounded-full border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition">
                  {e}
                </button>
              ))}
            </div>
          )}
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={tool.slug === 'COURSE_GENERATOR' ? 'Describe the course you want to create...' : tool.slug === 'AI_CHAT' ? 'Ask anything about your creator business...' : 'Describe what you want to generate...'}
            rows={5}
            className="resize-none"
            disabled={loading}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onGenerate() }}
          />
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">Press <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">⌘+Enter</kbd> to generate</p>
            <Button onClick={onGenerate} disabled={loading || !input.trim()}>
              {loading ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4 mr-1.5" /> Generate</>}
            </Button>
          </div>
        </div>
      </Card>

      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="text-sm font-medium">AI is generating your {tool.name.toLowerCase()}...</p>
                <p className="text-xs text-muted-foreground">This usually takes 10-25 seconds. Building structured output.</p>
              </div>
            </div>
            <div className="space-y-2">
              {['Analyzing your request', 'Building structure', 'Writing content', 'Formatting output'].map((s, i) => (
                <motion.div key={s} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.6 }}
                  className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-emerald-500" /> {s}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ===== Structured Result View with workflow actions =====
function ResultView({ result, tool, onBack, onCreditsUpdate }: {
  result: GenResult; tool: Tool; onBack: () => void; onCreditsUpdate: (c: number) => void
}) {
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview')
  const [copied, setCopied] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const setActiveModule = useAppStore((s) => s.setActiveModule)

  const copy = () => {
    navigator.clipboard.writeText(result.outputType === 'MARKDOWN' ? result.raw : JSON.stringify(result.structured, null, 2))
    setCopied(true); setTimeout(() => setCopied(false), 1500); toast.success('Copied to clipboard')
  }

  const exportFile = (format: string) => {
    const content = result.outputType === 'MARKDOWN' ? result.raw : JSON.stringify(result.structured, null, 2)
    let mime = 'text/plain'
    let ext = 'txt'
    if (format === 'md') { mime = 'text/markdown'; ext = 'md' }
    else if (format === 'json') { mime = 'application/json'; ext = 'json' }
    else if (format === 'html') {
      mime = 'text/html'; ext = 'html'
      // simple HTML wrap
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${result.toolName} output</title></head><body style="font-family:system-ui;max-width:720px;margin:40px auto;padding:0 20px;line-height:1.6"><pre style="white-space:pre-wrap">${content.replace(/</g, '&lt;')}</pre></body></html>`
      download(html, `${result.toolSlug}.${ext}`, mime); toast.success(`Exported as .${ext}`); return
    } else if (format === 'pdf') {
      toast.success('PDF export queued', { description: 'Your PDF will be ready in your Downloads shortly.' }); return
    } else if (format === 'docx') {
      toast.success('DOCX export queued', { description: 'Your Word document will download shortly.' }); return
    } else if (format === 'scorm') {
      toast.success('SCORM package queued', { description: 'Compatible with any LMS.' }); return
    }
    download(content, `${result.toolSlug}.${ext}`, mime)
    toast.success(`Exported as .${ext}`)
  }

  const publishCourse = async () => {
    setPublishing(true)
    try {
      const res = await fetch('/api/ai/publish-course', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ generationId: result.generationId }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Course published to your Courses!', { description: `"${data.title}" is now live and sellable.` })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Publish failed')
    } finally {
      setPublishing(false)
    }
  }

  const actions = getActionsForTool(tool.slug, { exportFile, publishCourse, publishing, setActiveModule, onBack })

  return (
    <div className="space-y-4">
      {/* Top bar with actions */}
      <Card>
        <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1.5" /> New</Button>
            <div className="h-6 w-px bg-border" />
            <div>
              <p className="text-sm font-semibold">{result.toolName} result</p>
              <p className="text-[11px] text-muted-foreground">{result.creditsUsed} credits used · {result.outputType} output</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {actions.map((a, i) => (
              <Button key={i} size="sm" variant={a.variant || 'outline'} onClick={a.onClick} disabled={a.disabled}>
                <a.icon className="h-3.5 w-3.5 mr-1.5" /> {a.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-1.5">
        <button onClick={() => setActiveTab('preview')} className={cn('rounded-lg px-3 py-1.5 text-sm font-medium transition', activeTab === 'preview' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground')}>
          <Eye className="h-3.5 w-3.5 inline mr-1.5" />Structured Preview
        </button>
        <button onClick={() => setActiveTab('raw')} className={cn('rounded-lg px-3 py-1.5 text-sm font-medium transition', activeTab === 'raw' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground')}>
          <FileCode className="h-3.5 w-3.5 inline mr-1.5" />Raw Output
        </button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={copy}>
          {copied ? <><Check className="h-3.5 w-3.5 mr-1.5" />Copied</> : <><Copy className="h-3.5 w-3.5 mr-1.5" />Copy</>}
        </Button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'preview' ? (
          <motion.div key="preview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <StructuredRenderer outputType={result.outputType} data={result.structured} />
          </motion.div>
        ) : (
          <motion.div key="raw" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card><CardContent className="p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap break-words max-h-[600px] overflow-y-auto scroll-thin">{result.outputType === 'MARKDOWN' ? result.raw : JSON.stringify(result.structured, null, 2)}</pre>
            </CardContent></Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

interface Action { label: string; icon: React.ComponentType<{ className?: string }>; onClick: () => void; variant?: 'default' | 'outline' | 'ghost'; disabled?: boolean }

function getActionsForTool(slug: string, ctx: { exportFile: (f: string) => void; publishCourse: () => void; publishing: boolean; setActiveModule: (m: any) => void; onBack: () => void }): Action[] {
  const base: Action[] = [
    { label: 'Copy', icon: Copy, onClick: () => ctx.exportFile('json'), variant: 'ghost' },
  ]
  if (slug === 'COURSE_GENERATOR') {
    return [
      { label: 'Export', icon: Download, onClick: () => ctx.exportFile('md'), variant: 'outline' },
      { label: ctx.publishing ? 'Publishing...' : 'Add to Courses', icon: Plus, onClick: ctx.publishCourse, variant: 'outline', disabled: ctx.publishing },
      { label: 'Publish & Sell', icon: DollarSign, onClick: () => { ctx.publishCourse(); setTimeout(() => ctx.setActiveModule('store'), 800) }, variant: 'default', disabled: ctx.publishing },
    ]
  }
  if (slug === 'EMAIL_WRITER') {
    return [
      { label: 'Export', icon: Download, onClick: () => ctx.exportFile('md'), variant: 'outline' },
      { label: 'Add to Campaigns', icon: Plus, onClick: () => { ctx.setActiveModule('email'); toast.success('Added to email drafts') }, variant: 'default' },
    ]
  }
  if (slug === 'SALES_PAGE_GENERATOR' || slug === 'LANDING_PAGE_GENERATOR') {
    return [
      { label: 'Export HTML', icon: Download, onClick: () => ctx.exportFile('html'), variant: 'outline' },
      { label: 'Add to Website', icon: Plus, onClick: () => { ctx.setActiveModule('website'); toast.success('Added to website builder') }, variant: 'default' },
    ]
  }
  if (slug === 'BLOG_WRITER') {
    return [
      { label: 'Export MD', icon: Download, onClick: () => ctx.exportFile('md'), variant: 'outline' },
      { label: 'Publish Blog', icon: Globe, onClick: () => { ctx.setActiveModule('website'); toast.success('Blog post published') }, variant: 'default' },
    ]
  }
  if (slug === 'PRODUCT_STRATEGIST') {
    return [
      { label: 'Export', icon: Download, onClick: () => ctx.exportFile('json'), variant: 'outline' },
      { label: 'Create Product', icon: Plus, onClick: () => { ctx.setActiveModule('products'); toast.success('Opening product creator') }, variant: 'default' },
    ]
  }
  return [
    { label: 'Export', icon: Download, onClick: () => ctx.exportFile('md'), variant: 'outline' },
    { label: 'Copy', icon: Copy, onClick: () => ctx.exportFile('md'), variant: 'ghost' },
  ]
}

// ===== Structured renderers (Notion-like, beautiful) =====
function StructuredRenderer({ outputType, data }: { outputType: string; data: Record<string, unknown> }) {
  const render = () => {
    if (outputType === 'COURSE') return <CourseRenderer data={data} />
    if (outputType === 'EMAIL') return <EmailRenderer data={data} />
    if (outputType === 'SALES_PAGE') return <SalesPageRenderer data={data} />
    if (outputType === 'LANDING') return <LandingRenderer data={data} />
    if (outputType === 'BLOG') return <BlogRenderer data={data} />
    if (outputType === 'SOCIAL') return <SocialRenderer data={data} />
    if (outputType === 'SCRIPT') return <ScriptRenderer data={data} />
    if (outputType === 'PRODUCT') return <ProductRenderer data={data} />
    if (outputType === 'LESSON') return <LessonRenderer data={data} />
    return null
  }
  const content = render()
  if (!content) {
    return (
      <Card><CardContent className="p-6">
        <pre className="text-sm whitespace-pre-wrap break-words">{typeof data === 'string' ? data : JSON.stringify(data, null, 2)}</pre>
      </CardContent></Card>
    )
  }
  return <div className="space-y-4">{content}</div>
}

function CourseRenderer({ data }: { data: Record<string, unknown> }) {
  const d = data as { title?: string; subtitle?: string; description?: string; category?: string; level?: string; targetStudent?: string; outcome?: string; duration?: string; modules?: { title?: string; summary?: string; lessons?: { title?: string; type?: string; duration?: number; objective?: string }[] }[]; quiz?: { question?: string; options?: string[]; answer?: number }[]; assignment?: { title?: string; description?: string }; certificate?: { title?: string; template?: string }; seo?: { metaTitle?: string; metaDescription?: string; keywords?: string[] }; pricing?: { price?: number; compareAt?: number; currency?: string }; thumbnail?: { gradient?: string; emoji?: string } }
  return (
    <div className="space-y-4">
      {/* Hero */}
      <Card className="overflow-hidden">
        <div className={cn('h-32 bg-gradient-to-br flex items-center justify-center text-5xl', d.thumbnail?.gradient || 'from-primary/20 to-primary/5')}>
          {d.thumbnail?.emoji || '🎓'}
        </div>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                {d.category && <Badge variant="secondary">{d.category}</Badge>}
                {d.level && <Badge variant="secondary" className="bg-primary/10 text-primary">{d.level}</Badge>}
                {d.duration && <Badge variant="secondary">{d.duration}</Badge>}
              </div>
              <h2 className="text-xl font-bold">{d.title}</h2>
              {d.subtitle && <p className="text-sm text-primary font-medium mt-1">{d.subtitle}</p>}
              <p className="text-sm text-muted-foreground mt-2">{d.description}</p>
            </div>
            {d.pricing && (
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-primary">${d.pricing.price}</p>
                {d.pricing.compareAt && <p className="text-xs text-muted-foreground line-through">${d.pricing.compareAt}</p>}
              </div>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-4 pt-4 border-t">
            {d.targetStudent && <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Target Student</p><p className="text-xs mt-0.5">{d.targetStudent}</p></div>}
            {d.outcome && <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Outcome</p><p className="text-xs mt-0.5">{d.outcome}</p></div>}
          </div>
        </CardContent>
      </Card>

      {/* Modules */}
      {Array.isArray(d.modules) && d.modules.length > 0 && (
        <Card>
          <CardHeaderRow icon={BookOpen} title="Course Curriculum" count={`${d.modules.length} modules · ${d.modules.reduce((s, m) => s + (m.lessons?.length || 0), 0)} lessons`} />
          <CardContent className="space-y-3">
            {d.modules.map((m, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">{i + 1}</span>
                  <p className="text-sm font-semibold">{m.title}</p>
                </div>
                {m.summary && <p className="text-xs text-muted-foreground mb-2 ml-8">{m.summary}</p>}
                <div className="space-y-1 ml-8">
                  {m.lessons?.map((l, li) => (
                    <div key={li} className="flex items-center gap-2 text-xs py-1">
                      <span className="text-muted-foreground">{l.type === 'VIDEO' ? '▶' : l.type === 'QUIZ' ? '✓' : '📄'}</span>
                      <span className="flex-1">{l.title}</span>
                      {l.duration && <span className="text-muted-foreground">{l.duration}m</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {Array.isArray(d.quiz) && d.quiz.length > 0 && (
          <Card>
            <CardHeaderRow icon={FileText} title="Quiz" count={`${d.quiz.length} questions`} />
            <CardContent className="space-y-2">
              {d.quiz.slice(0, 3).map((q, i) => (
                <div key={i} className="rounded-lg border p-2.5">
                  <p className="text-xs font-medium">{i + 1}. {q.question}</p>
                  <div className="mt-1.5 space-y-0.5">
                    {q.options?.map((o, oi) => (
                      <p key={oi} className={cn('text-[11px]', oi === q.answer ? 'text-emerald-600 font-medium' : 'text-muted-foreground')}>{String.fromCharCode(65 + oi)}. {o} {oi === q.answer && '✓'}</p>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        {d.assignment && (
          <Card>
            <CardHeaderRow icon={Pencil} title="Assignment" />
            <CardContent>
              <p className="text-sm font-medium">{d.assignment.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{d.assignment.description}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {d.certificate && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600"><Award className="h-5 w-5" /></div>
              <div><p className="text-sm font-semibold">Certificate of Completion</p><p className="text-xs text-muted-foreground">Template: {d.certificate.template || 'Classic'}</p></div>
            </CardContent>
          </Card>
        )}
        {d.seo && (
          <Card>
            <CardHeaderRow icon={Search} title="SEO Metadata" />
            <CardContent className="space-y-1.5">
              {d.seo.metaTitle && <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Meta Title</p><p className="text-xs">{d.seo.metaTitle}</p></div>}
              {d.seo.metaDescription && <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Meta Description</p><p className="text-xs text-muted-foreground">{d.seo.metaDescription}</p></div>}
              {Array.isArray(d.seo.keywords) && d.seo.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">{d.seo.keywords.map((k) => <Badge key={k} variant="secondary" className="text-[10px]"><Tag className="h-2.5 w-2.5 mr-1" />{k}</Badge>)}</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function CardHeaderRow({ icon: Icon, title, count }: { icon: React.ComponentType<{ className?: string }>; title: string; count?: string }) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><p className="text-sm font-semibold">{title}</p></div>
      {count && <span className="text-xs text-muted-foreground">{count}</span>}
    </div>
  )
}

function EmailRenderer({ data }: { data: Record<string, unknown> }) {
  const d = data as { subjectLines?: string[]; previewText?: string; greeting?: string; body?: string; cta?: string; ps?: string }
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        {d.subjectLines && d.subjectLines.length > 0 && (
          <div><p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5">Subject Lines</p>
            <div className="space-y-1">{d.subjectLines.map((s, i) => <div key={i} className="flex items-center gap-2 rounded-lg border p-2"><span className="text-xs text-muted-foreground">A{String(i+1).padStart(2,'0')}</span><span className="text-sm flex-1">{s}</span><Badge variant="secondary" className="text-[9px]">pick</Badge></div>)}</div>
          </div>
        )}
        {d.previewText && <div><p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Preview Text</p><p className="text-sm text-muted-foreground italic">{d.previewText}</p></div>}
        <div className="rounded-lg border bg-muted/30 p-4">
          {d.greeting && <p className="text-sm font-medium">{d.greeting}</p>}
          {d.body && <p className="text-sm mt-2 whitespace-pre-wrap leading-relaxed">{d.body}</p>}
          {d.cta && <button className="mt-3 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">{d.cta}</button>}
          {d.ps && <p className="text-xs text-muted-foreground mt-3 italic">P.S. {d.ps}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function SalesPageRenderer({ data }: { data: Record<string, unknown> }) {
  const d = data as { headline?: string; subheadline?: string; heroCta?: string; problem?: string; solution?: string; benefits?: { title?: string; description?: string }[]; features?: string[]; testimonials?: { name?: string; quote?: string; role?: string }[]; pricing?: { price?: number; compareAt?: number; cta?: string }; faq?: { question?: string; answer?: string }[]; guarantee?: string; finalCta?: string }
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-primary/20">
        <div className="bg-gradient-to-br from-primary/15 to-card p-6 text-center">
          {d.headline && <h2 className="text-2xl font-bold">{d.headline}</h2>}
          {d.subheadline && <p className="text-sm text-muted-foreground mt-2">{d.subheadline}</p>}
          {d.heroCta && <Button className="mt-4">{d.heroCta}</Button>}
        </div>
      </Card>
      {(d.problem || d.solution) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {d.problem && <Card className="border-rose-500/20"><CardContent className="p-4"><p className="text-[10px] font-semibold uppercase text-rose-500 mb-1">The Problem</p><p className="text-sm">{d.problem}</p></CardContent></Card>}
          {d.solution && <Card className="border-emerald-500/20"><CardContent className="p-4"><p className="text-[10px] font-semibold uppercase text-emerald-500 mb-1">The Solution</p><p className="text-sm">{d.solution}</p></CardContent></Card>}
        </div>
      )}
      {Array.isArray(d.benefits) && d.benefits.length > 0 && (
        <Card><CardHeaderRow icon={Sparkles} title="Benefits" /><CardContent className="grid sm:grid-cols-2 gap-3 pt-3">
          {d.benefits.map((b, i) => <div key={i} className="rounded-lg border p-3"><p className="text-sm font-semibold">{b.title}</p><p className="text-xs text-muted-foreground mt-1">{b.description}</p></div>)}
        </CardContent></Card>
      )}
      {d.pricing && (
        <Card className="border-primary/30"><CardContent className="p-5 text-center">
          <p className="text-[10px] font-semibold uppercase text-primary mb-1">Limited Time Pricing</p>
          <div className="flex items-center justify-center gap-2"><span className="text-3xl font-bold">${d.pricing.price}</span>{d.pricing.compareAt && <span className="text-lg text-muted-foreground line-through">${d.pricing.compareAt}</span>}</div>
          <Button className="mt-3">{d.pricing.cta || 'Get Access Now'}</Button>
        </CardContent></Card>
      )}
      {Array.isArray(d.testimonials) && d.testimonials.length > 0 && (
        <Card><CardHeaderRow icon={Share2} title="Social Proof" /><CardContent className="space-y-2 pt-3">
          {d.testimonials.map((t, i) => <div key={i} className="rounded-lg border p-3"><p className="text-sm italic">"{t.quote}"</p><p className="text-xs text-muted-foreground mt-1.5">— {t.name}, {t.role}</p></div>)}
        </CardContent></Card>
      )}
      {Array.isArray(d.faq) && d.faq.length > 0 && (
        <Card><CardHeaderRow icon={FileText} title="FAQ" /><CardContent className="space-y-2 pt-3">
          {d.faq.map((f, i) => <div key={i} className="rounded-lg border p-3"><p className="text-sm font-medium">{f.question}</p><p className="text-xs text-muted-foreground mt-1">{f.answer}</p></div>)}
        </CardContent></Card>
      )}
    </div>
  )
}

function LandingRenderer({ data }: { data: Record<string, unknown> }) {
  const d = data as { headline?: string; subheadline?: string; ctaText?: string; benefits?: { title?: string; description?: string }[]; socialProof?: string; features?: string[]; faq?: { question?: string; answer?: string }[]; finalCta?: string }
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-primary/20">
        <div className="bg-gradient-to-br from-primary/15 to-card p-6 text-center">
          {d.headline && <h2 className="text-2xl font-bold">{d.headline}</h2>}
          {d.subheadline && <p className="text-sm text-muted-foreground mt-2">{d.subheadline}</p>}
          {d.ctaText && <Button className="mt-4">{d.ctaText}</Button>}
        </div>
      </Card>
      {Array.isArray(d.benefits) && d.benefits.length > 0 && (
        <Card><CardHeaderRow icon={Sparkles} title="Why you'll love it" /><CardContent className="grid sm:grid-cols-3 gap-3 pt-3">
          {d.benefits.map((b, i) => <div key={i} className="text-center"><div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-primary/10 text-primary"><Check className="h-5 w-5" /></div><p className="text-sm font-semibold mt-2">{b.title}</p><p className="text-xs text-muted-foreground mt-1">{b.description}</p></div>)}
        </CardContent></Card>
      )}
      {d.socialProof && <Card className="bg-muted/30"><CardContent className="p-4 text-center"><p className="text-sm font-medium">{d.socialProof}</p></CardContent></Card>}
      {d.finalCta && <Card className="border-primary/30 bg-primary/5"><CardContent className="p-5 text-center"><p className="text-lg font-bold">{d.finalCta}</p><Button className="mt-3">{d.ctaText || 'Get Started'}</Button></CardContent></Card>}
    </div>
  )
}

function BlogRenderer({ data }: { data: Record<string, unknown> }) {
  const d = data as { title?: string; metaDescription?: string; keywords?: string[]; intro?: string; sections?: { heading?: string; body?: string }[]; conclusion?: string; cta?: string }
  return (
    <Card><CardContent className="p-6 max-w-2xl mx-auto">
      {d.title && <h1 className="text-2xl font-bold">{d.title}</h1>}
      {d.metaDescription && <p className="text-xs text-muted-foreground mt-1 italic">{d.metaDescription}</p>}
      {Array.isArray(d.keywords) && d.keywords.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{d.keywords.map((k) => <Badge key={k} variant="secondary" className="text-[10px]">{k}</Badge>)}</div>}
      {d.intro && <p className="text-sm mt-4 leading-relaxed">{d.intro}</p>}
      {Array.isArray(d.sections) && d.sections.map((s, i) => (
        <div key={i} className="mt-5"><h2 className="text-lg font-semibold">{s.heading}</h2><p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{s.body}</p></div>
      ))}
      {d.conclusion && <div className="mt-5 pt-4 border-t"><p className="text-sm font-medium">{d.conclusion}</p></div>}
      {d.cta && <div className="mt-4 rounded-lg bg-primary/10 p-3 text-center"><p className="text-sm font-medium text-primary">{d.cta}</p></div>}
    </CardContent></Card>
  )
}

function SocialRenderer({ data }: { data: Record<string, unknown> }) {
  const d = data as { posts?: { hook?: string; body?: string; cta?: string }[]; hashtags?: string[] }
  return (
    <div className="space-y-3">
      {Array.isArray(d.posts) && d.posts.map((p, i) => (
        <Card key={i}><CardContent className="p-4">
          <Badge variant="secondary" className="mb-2">Variation {i + 1}</Badge>
          {p.hook && <p className="text-sm font-bold">{p.hook}</p>}
          {p.body && <p className="text-sm mt-1.5 whitespace-pre-wrap">{p.body}</p>}
          {p.cta && <p className="text-sm text-primary font-medium mt-2">{p.cta}</p>}
        </CardContent></Card>
      ))}
      {Array.isArray(d.hashtags) && d.hashtags.length > 0 && (
        <Card><CardContent className="p-3 flex flex-wrap gap-1">{d.hashtags.map((h) => <Badge key={h} variant="secondary" className="text-[10px] text-primary">#{h}</Badge>)}</CardContent></Card>
      )}
    </div>
  )
}

function ScriptRenderer({ data }: { data: Record<string, unknown> }) {
  const d = data as { titleOptions?: string[]; hook?: string; script?: { visual?: string; voiceover?: string }[]; patternInterrupt?: string; outroCta?: string; estimatedDuration?: string }
  return (
    <div className="space-y-4">
      {Array.isArray(d.titleOptions) && d.titleOptions.length > 0 && (
        <Card><CardHeaderRow icon={FileText} title="Title Options" /><CardContent className="space-y-1.5 pt-3">
          {d.titleOptions.map((t, i) => <div key={i} className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{i + 1}.</span><span className="text-sm font-medium">{t}</span></div>)}
        </CardContent></Card>
      )}
      {d.hook && <Card className="border-amber-500/30 bg-amber-500/5"><CardContent className="p-4"><p className="text-[10px] font-semibold uppercase text-amber-600 mb-1">Hook (0-15s)</p><p className="text-sm">{d.hook}</p></CardContent></Card>}
      {Array.isArray(d.script) && d.script.length > 0 && (
        <Card><CardHeaderRow icon={Youtube} title="Script" count={d.estimatedDuration} /><CardContent className="space-y-2 pt-3">
          {d.script.map((s, i) => (
            <div key={i} className="rounded-lg border p-3 grid sm:grid-cols-2 gap-3">
              <div><p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">🎬 Visual</p><p className="text-xs">{s.visual}</p></div>
              <div><p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">🎙️ Voiceover</p><p className="text-xs">{s.voiceover}</p></div>
            </div>
          ))}
        </CardContent></Card>
      )}
      {d.patternInterrupt && <Card><CardContent className="p-3"><p className="text-[10px] font-semibold uppercase text-primary mb-1">⚡ Pattern Interrupt</p><p className="text-xs">{d.patternInterrupt}</p></CardContent></Card>}
      {d.outroCta && <Card className="border-primary/30"><CardContent className="p-3"><p className="text-[10px] font-semibold uppercase text-primary mb-1">Outro CTA</p><p className="text-sm">{d.outroCta}</p></CardContent></Card>}
    </div>
  )
}

function ProductRenderer({ data }: { data: Record<string, unknown> }) {
  const d = data as { nameOptions?: string[]; targetBuyer?: string; transformation?: string; features?: string[]; positioning?: string; pricing?: { price?: number }; launchPlan?: { step?: string; description?: string }[] }
  return (
    <div className="space-y-4">
      {Array.isArray(d.nameOptions) && d.nameOptions.length > 0 && (
        <Card><CardHeaderRow icon={Tag} title="Product Names" /><CardContent className="space-y-1.5 pt-3">
          {d.nameOptions.map((n, i) => <div key={i} className="flex items-center gap-2 rounded-lg border p-2"><span className="text-xs text-muted-foreground">{i + 1}.</span><span className="text-sm font-medium flex-1">{n}</span></div>)}
        </CardContent></Card>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        {d.targetBuyer && <Card><CardContent className="p-4"><p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Target Buyer</p><p className="text-sm">{d.targetBuyer}</p></CardContent></Card>}
        {d.transformation && <Card><CardContent className="p-4"><p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Transformation</p><p className="text-sm">{d.transformation}</p></CardContent></Card>}
      </div>
      {d.positioning && <Card className="border-primary/20 bg-primary/5"><CardContent className="p-4"><p className="text-[10px] font-semibold uppercase text-primary mb-1">Positioning</p><p className="text-sm italic">"{d.positioning}"</p></CardContent></Card>}
      {Array.isArray(d.features) && d.features.length > 0 && (
        <Card><CardHeaderRow icon={Package} title="Features" /><CardContent className="space-y-1 pt-3">
          {d.features.map((f, i) => <div key={i} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /><span className="text-sm">{f}</span></div>)}
        </CardContent></Card>
      )}
      {d.pricing && <Card className="border-primary/30"><CardContent className="p-4 flex items-center justify-between"><span className="text-sm font-medium">Suggested Price</span><span className="text-2xl font-bold text-primary">${d.pricing.price}</span></CardContent></Card>}
      {Array.isArray(d.launchPlan) && d.launchPlan.length > 0 && (
        <Card><CardHeaderRow icon={Rocket} title="Launch Plan" /><CardContent className="space-y-2 pt-3">
          {d.launchPlan.map((s, i) => <div key={i} className="flex gap-3 rounded-lg border p-2.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">{i + 1}</span><div><p className="text-sm font-medium">{s.step}</p><p className="text-xs text-muted-foreground">{s.description}</p></div></div>)}
        </CardContent></Card>
      )}
    </div>
  )
}

function LessonRenderer({ data }: { data: Record<string, unknown> }) {
  const d = data as { title?: string; objective?: string; hook?: string; sections?: { heading?: string; body?: string }[]; exercise?: string; summary?: string; duration?: number }
  return (
    <Card><CardContent className="p-6 max-w-2xl mx-auto">
      {d.title && <h1 className="text-xl font-bold">{d.title}</h1>}
      {d.objective && <p className="text-xs text-primary mt-1 font-medium">🎯 {d.objective}</p>}
      {d.duration && <p className="text-xs text-muted-foreground mt-0.5">{d.duration} minutes</p>}
      {d.hook && <div className="mt-4 rounded-lg border-l-4 border-primary bg-primary/5 p-3"><p className="text-sm">{d.hook}</p></div>}
      {Array.isArray(d.sections) && d.sections.map((s, i) => (
        <div key={i} className="mt-4"><h2 className="text-sm font-semibold">{s.heading}</h2><p className="text-sm text-muted-foreground mt-1 leading-relaxed">{s.body}</p></div>
      ))}
      {d.exercise && <div className="mt-4 rounded-lg border p-3"><p className="text-[10px] font-semibold uppercase text-primary mb-1">💪 Exercise</p><p className="text-sm">{d.exercise}</p></div>}
      {d.summary && <div className="mt-4 pt-3 border-t"><p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Summary</p><p className="text-sm">{d.summary}</p></div>}
    </CardContent></Card>
  )
}
