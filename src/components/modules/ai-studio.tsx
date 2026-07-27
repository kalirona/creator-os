'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Send, MessageSquare, GraduationCap, FileText, Mail, ShoppingCart,
  PenLine, Share2, Youtube, Package, LayoutTemplate, Zap, Copy, Check, RotateCcw, User, Bot, ChevronDown, Wand2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

interface Tool { id: string; label: string; icon: React.ComponentType<{ className?: string }>; cost: number; desc: string; placeholder: string; examples: string[] }

const TOOLS: Tool[] = [
  { id: 'CHAT', label: 'AI Chat', icon: MessageSquare, cost: 2, desc: 'General creator business assistant', placeholder: 'Ask anything about growing your creator business...', examples: ['How do I price my first course?', 'Best funnel for a $49 product?', 'How to get my first 1000 email subscribers?'] },
  { id: 'COURSE', label: 'Course Generator', icon: GraduationCap, cost: 15, desc: 'Design a complete sellable course outline', placeholder: 'Describe the course you want to create. e.g. "A course teaching beginners how to start a faceless YouTube channel"', examples: ['Course on selling Notion templates', 'Course for fitness coaches on online programs', 'Course on AI art for beginners'] },
  { id: 'LESSON', label: 'Lesson Writer', icon: FileText, cost: 5, desc: 'Write a full lesson with exercises', placeholder: 'What lesson should I write? e.g. "How to write a hook for a YouTube video that gets 50% retention"', examples: ['Lesson on email subject lines', 'Lesson on setting up a sales funnel', 'Lesson on filming B-roll'] },
  { id: 'EMAIL', label: 'Email Generator', icon: Mail, cost: 4, desc: 'High-converting email copy', placeholder: 'What email do you need? e.g. "Welcome email for new subscribers who downloaded my Notion template"', examples: ['Launch email for new course', 'Abandoned cart email', 'Re-engagement email for cold list'] },
  { id: 'SALES', label: 'Sales Page', icon: ShoppingCart, cost: 12, desc: 'Long-form sales page copy', placeholder: 'Describe the product for the sales page. e.g. "A $297 course teaching coaches how to land clients on LinkedIn"', examples: ['Sales page for membership', 'Sales page for template bundle', 'Sales page for 1-on-1 coaching'] },
  { id: 'BLOG', label: 'Blog Writer', icon: PenLine, cost: 8, desc: 'SEO blog posts with structure', placeholder: 'What blog post topic? e.g. "10 AI tools every creator should use in 2025"', examples: ['How to start a newsletter', 'Notion vs Evernote for creators', 'Monetizing a small audience'] },
  { id: 'SOCIAL', label: 'Social Media', icon: Share2, cost: 3, desc: 'Platform-native social posts', placeholder: 'What do you want to post about and on which platform? e.g. "Announcing my new course on Twitter"', examples: ['Twitter thread on productivity', 'LinkedIn post about my journey', 'Instagram caption for new product'] },
  { id: 'SCRIPT', label: 'YouTube Script', icon: Youtube, cost: 10, desc: 'Retention-optimized video scripts', placeholder: 'What video? e.g. "How I built a $10K/mo Notion template business"', examples: ['8-min video on time blocking', 'Tutorial: Notion for creators', 'Day in the life of a creator'] },
  { id: 'PRODUCT', label: 'Product Strategist', icon: Package, cost: 6, desc: 'Ideate and position digital products', placeholder: 'What kind of product? e.g. "A digital product for busy parents who want to meal plan"', examples: ['Product idea for designers', 'Notion template for freelancers', 'Prompt pack for marketers'] },
  { id: 'LANDING', label: 'Landing Page', icon: LayoutTemplate, cost: 7, desc: 'High-converting landing page copy', placeholder: 'What is the landing page for? e.g. "Free lead magnet: 50 ChatGPT prompts for creators"', examples: ['Landing page for webinar', 'Landing page for ebook', 'Landing page for waitlist'] },
]

interface Msg { role: 'user' | 'assistant'; content: string; tool?: string }

export function AiStudioModule() {
  const [activeTool, setActiveTool] = useState<Tool>(TOOLS[0])
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>([])
  const [loading, setLoading] = useState(false)
  const [credits, setCredits] = useState(4280)
  const [copied, setCopied] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const send = async (overrideInput?: string) => {
    const text = (overrideInput ?? input).trim()
    if (!text || loading) return
    if (credits < activeTool.cost) {
      toast.error('Not enough credits. Buy more to continue.')
      return
    }

    const userMsg: Msg = { role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: activeTool.id, messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setMessages((m) => [...m, { role: 'assistant', content: data.content, tool: activeTool.id }])
      setCredits((c) => Math.max(0, c - (data.creditsUsed || activeTool.cost)))
      toast.success(`Generated! -${data.creditsUsed || activeTool.cost} credits`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
    toast.success('Copied to clipboard')
  }

  const reset = () => {
    setMessages([])
    toast.info('Conversation cleared')
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr] h-[calc(100vh-180px)]">
      {/* Tools sidebar */}
      <Card className="flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">AI Studio</p>
              <p className="text-[10px] text-muted-foreground">10 specialized tools</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <span className="text-xs text-muted-foreground">Credits</span>
            <span className="text-sm font-bold tabular-nums text-primary">{credits.toLocaleString()}</span>
          </div>
        </div>
        <ScrollArea className="flex-1 scroll-thin">
          <div className="p-2 space-y-0.5">
            {TOOLS.map((t) => {
              const Icon = t.icon
              const active = activeTool.id === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => { setActiveTool(t); setMessages([]) }}
                  className={cn(
                    'group flex w-full items-start gap-2.5 rounded-lg p-2.5 text-left transition',
                    active ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-muted/60'
                  )}
                >
                  <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={cn('text-xs font-semibold truncate', active && 'text-primary')}>{t.label}</p>
                      <Badge variant="secondary" className="shrink-0 text-[9px] h-4 px-1">{t.cost}cr</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{t.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat panel */}
      <Card className="flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border p-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <activeTool.icon className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{activeTool.label}</p>
              <p className="text-[11px] text-muted-foreground truncate">{activeTool.desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue="zai-glm">
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zai-glm">Z.ai GLM-4.6</SelectItem>
                <SelectItem value="gpt-4o" disabled>Coming soon</SelectItem>
                <SelectItem value="claude" disabled>Coming soon</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={reset} disabled={messages.length === 0}>
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-thin p-4 space-y-4">
          {messages.length === 0 ? (
            <EmptyState tool={activeTool} onPick={(ex) => send(ex)} />
          ) : (
            messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex gap-3', m.role === 'user' && 'flex-row-reverse')}
              >
                <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border">
                  {m.role === 'user'
                    ? <AvatarFallback className="bg-primary/15 text-primary text-[10px]">AR</AvatarFallback>
                    : <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground"><Bot className="h-4 w-4" /></AvatarFallback>}
                </Avatar>
                <div className={cn('group relative max-w-[85%] rounded-2xl px-4 py-3', m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                  {m.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed [&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-3 [&_h1]:mb-1.5 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_strong]:font-semibold [&_code]:rounded [&_code]:bg-background [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_pre]:rounded-lg [&_pre]:bg-background [&_pre]:p-3 [&_pre]:text-xs [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  )}
                  {m.role === 'assistant' && (
                    <button
                      onClick={() => copy(m.content, String(i))}
                      className="absolute -bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full border bg-card opacity-0 shadow-sm transition group-hover:opacity-100 hover:bg-accent"
                    >
                      {copied === String(i) ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
          {loading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground"><Bot className="h-4 w-4" /></AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="h-2 w-2 rounded-full bg-primary/60"
                      animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">Generating...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border p-3">
          {messages.length === 0 && activeTool.examples.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {activeTool.examples.map((ex) => (
                <button key={ex} onClick={() => send(ex)}
                  className="rounded-full border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition">
                  {ex}
                </button>
              ))}
            </div>
          )}
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder={activeTool.placeholder}
              rows={2}
              className="min-h-[52px] resize-none pr-24 text-sm"
              disabled={loading}
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground hidden sm:inline">{activeTool.cost} credits</span>
              <Button size="icon" className="h-8 w-8 rounded-lg" onClick={() => send()} disabled={loading || !input.trim()}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground text-center">
            Press <kbd className="rounded border bg-muted px-1 font-mono">Enter</kbd> to send · <kbd className="rounded border bg-muted px-1 font-mono">Shift+Enter</kbd> for new line
          </p>
        </div>
      </Card>
    </div>
  )
}

function EmptyState({ tool, onPick }: { tool: Tool; onPick: (s: string) => void }) {
  const Icon = tool.icon
  return (
    <div className="flex h-full flex-col items-center justify-center text-center px-6 py-10">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative mb-5"
      >
        <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-2xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30">
          <Icon className="h-8 w-8 text-primary-foreground" />
        </div>
      </motion.div>
      <h3 className="text-lg font-semibold">{tool.label}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{tool.desc}</p>
      <div className="mt-6 w-full max-w-md space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 justify-center">
          <Wand2 className="h-3 w-3" /> Try an example
        </p>
        {tool.examples.map((ex) => (
          <button key={ex} onClick={() => onPick(ex)}
            className="group flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left text-sm hover:border-primary/40 hover:shadow-sm transition">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <span className="flex-1">{ex}</span>
            <ChevronDown className="h-4 w-4 -rotate-90 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
          </button>
        ))}
      </div>
    </div>
  )
}
