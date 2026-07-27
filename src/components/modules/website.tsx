'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, Eye, Plus, Layout, FileText, ShoppingCart, Info, Mail, ExternalLink, Sparkles, Search,
  ArrowLeft, Save, Trash2, GripVertical, Loader2, Monitor, Smartphone, Type, Image as ImageIcon, Star, HelpCircle, Megaphone,
} from 'lucide-react'
import { useApi, formatNumber } from '@/hooks/use-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/app-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Data {
  stats: { pages: number; totalVisits: number; published: number }
  pages: { id: string; title: string; slug: string; type: string; status: string; visits: number }[]
}
interface Block {
  id: string; pageId: string; type: string; content: Record<string, unknown>; position: number
}

const TYPE_META: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  LANDING: { icon: Layout, color: 'text-emerald-600 bg-emerald-500/10' },
  SALES: { icon: ShoppingCart, color: 'text-violet-600 bg-violet-500/10' },
  HOME: { icon: Globe, color: 'text-sky-600 bg-sky-500/10' },
  ABOUT: { icon: Info, color: 'text-amber-600 bg-amber-500/10' },
  CONTACT: { icon: Mail, color: 'text-rose-600 bg-rose-500/10' },
  BLOG: { icon: FileText, color: 'text-teal-600 bg-teal-500/10' },
  PRICING: { icon: ShoppingCart, color: 'text-indigo-600 bg-indigo-500/10' },
}

const BLOCK_TYPES = [
  { type: 'HERO', name: 'Hero', icon: Megaphone, desc: 'Headline + CTA' },
  { type: 'HEADING', name: 'Heading', icon: Type, desc: 'Section title' },
  { type: 'TEXT', name: 'Text', icon: FileText, desc: 'Paragraph block' },
  { type: 'FEATURES', name: 'Features', icon: Star, desc: 'Feature grid' },
  { type: 'PRICING', name: 'Pricing', icon: ShoppingCart, desc: 'Pricing tiers' },
  { type: 'TESTIMONIALS', name: 'Testimonials', icon: Star, desc: 'Social proof' },
  { type: 'CTA', name: 'Call to Action', icon: Megaphone, desc: 'Conversion CTA' },
  { type: 'FAQ', name: 'FAQ', icon: HelpCircle, desc: 'Q&A accordion' },
  { type: 'IMAGE', name: 'Image', icon: ImageIcon, desc: 'Visual block' },
]

export function WebsiteModule() {
  const { data, loading } = useApi<Data>('/api/data/website')
  const [editingPage, setEditingPage] = useState<{ id: string; title: string; slug: string } | null>(null)
  const setActiveModule = useAppStore((s) => s.setActiveModule)

  if (loading || !data) return <Skeleton className="h-96 rounded-xl" />

  if (editingPage) {
    return <PageEditor page={editingPage} onBack={() => setEditingPage(null)} />
  }

  const templates = [
    { name: 'Product Launch', desc: 'High-converting landing page for digital products', color: 'from-emerald-500/20 to-teal-500/10', blocks: ['HERO', 'FEATURES', 'TESTIMONIALS', 'PRICING', 'CTA'] },
    { name: 'Course Sales', desc: 'Long-form sales page with testimonials', color: 'from-violet-500/20 to-fuchsia-500/10', blocks: ['HERO', 'FEATURES', 'TESTIMONIALS', 'FAQ', 'PRICING', 'CTA'] },
    { name: 'Webinar Registration', desc: 'Capture leads for live or evergreen webinars', color: 'from-amber-500/20 to-orange-500/10', blocks: ['HERO', 'FEATURES', 'CTA'] },
    { name: 'Lead Magnet', desc: 'Free download opt-in page', color: 'from-sky-500/20 to-cyan-500/10', blocks: ['HERO', 'FEATURES', 'TESTIMONIALS', 'CTA'] },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Build landing pages, sales pages, and your public site.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setActiveModule('ai-studio')}><Sparkles className="h-4 w-4 mr-1.5 text-primary" /> AI Landing Page</Button>
          <Button size="sm" onClick={() => toast.success('New page created', { description: 'Untitled page added to your site. Click Edit to start building.' })}><Plus className="h-4 w-4 mr-1.5" /> New Page</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Pages', value: String(data.stats.pages), icon: FileText },
          { label: 'Total Visits', value: formatNumber(data.stats.totalVisits, true), icon: Eye },
          { label: 'Published', value: String(data.stats.published), icon: Globe },
          { label: 'Avg Conversion', value: '4.2%', icon: ShoppingCart },
        ].map((s) => { const Icon = s.icon; return (
          <Card key={s.label}><CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary"><Icon className="h-4 w-4" /></div>
            <div><p className="text-lg font-bold tabular-nums leading-none">{s.value}</p><p className="text-[11px] text-muted-foreground mt-1">{s.label}</p></div>
          </CardContent></Card>
        )})}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-base">Your Pages</CardTitle>
            <div className="relative w-48"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Search..." className="h-8 pl-8 text-xs" /></div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {data.pages.map((p, i) => {
              const meta = TYPE_META[p.type] || TYPE_META.HOME
              const Icon = meta.icon
              return (
                <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="group flex items-center gap-3 rounded-lg p-3 hover:bg-muted/50 transition cursor-pointer">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', meta.color)}><Icon className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><p className="text-sm font-medium truncate">{p.title}</p><Badge variant="secondary" className="text-[10px]">{p.type}</Badge></div>
                    <p className="text-xs text-muted-foreground truncate">creatoros.io/{p.slug}</p>
                  </div>
                  <div className="text-right"><p className="text-sm font-semibold tabular-nums">{formatNumber(p.visits, true)}</p><p className="text-[10px] text-muted-foreground">visits</p></div>
                  <Button size="sm" className="h-7 text-xs opacity-100" onClick={() => setEditingPage({ id: p.id, title: p.title, slug: p.slug })}>Edit</Button>
                </motion.div>
              )
            })}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Start from a template</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {templates.map((t) => (
                <button key={t.name} onClick={() => { const home = data.pages[0]; if (home) { setEditingPage({ id: home.id, title: home.title, slug: home.slug }); toast.success(`"${t.name}" template loaded`, { description: `${t.blocks.length} blocks ready to edit` }) } }}
                  className="group w-full text-left rounded-lg border p-3 hover:border-primary/40 hover:shadow-sm transition">
                  <div className={cn('mb-2 h-16 rounded-md bg-gradient-to-br flex items-center justify-center', t.color)}><Layout className="h-6 w-6 text-foreground/40" /></div>
                  <p className="text-xs font-semibold">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{t.desc}</p>
                  <div className="flex flex-wrap gap-0.5 mt-1.5">{t.blocks.map((b) => <Badge key={b} variant="secondary" className="text-[8px] h-3.5 px-1">{b}</Badge>)}</div>
                </button>
              ))}
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-primary/10 to-card border-primary/20">
            <CardContent className="p-4">
              <p className="text-xs font-semibold flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-primary" />Custom Domain</p>
              <p className="text-xs text-muted-foreground mt-1">Connect your own domain for a branded experience.</p>
              <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => toast.info('Domain setup wizard', { description: 'Connect a custom domain like yourbrand.com' })}><ExternalLink className="h-3.5 w-3.5 mr-1.5" />Connect domain</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ===== Real Page Editor with blocks + live preview =====
function PageEditor({ page, onBack }: { page: { id: string; title: string; slug: string }; onBack: () => void }) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [editingBlock, setEditingBlock] = useState<Block | null>(null)
  const [showAddPanel, setShowAddPanel] = useState(false)

  useEffect(() => {
    fetch(`/api/data/page?pageId=${page.id}`)
      .then((r) => r.json())
      .then((d) => { setBlocks(d.blocks || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [page.id])

  const addBlock = async (type: string) => {
    const defaultContent = getDefaultBlockContent(type)
    setSaving(true)
    try {
      const res = await fetch('/api/data/page', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pageId: page.id, type, content: defaultContent }) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setBlocks((b) => [...b, { ...d.block, content: JSON.parse(d.block.content) }])
      toast.success(`${type} block added`)
      setShowAddPanel(false)
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') }
    finally { setSaving(false) }
  }

  const updateBlock = async (id: string, content: Record<string, unknown>) => {
    setBlocks((b) => b.map((bl) => bl.id === id ? { ...bl, content } : bl))
    setSaving(true)
    try {
      await fetch('/api/data/page', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, content }) })
    } catch { toast.error('Save failed') } finally { setSaving(false) }
  }

  const deleteBlock = async (id: string) => {
    setBlocks((b) => b.filter((bl) => bl.id !== id))
    await fetch(`/api/data/page?id=${id}`, { method: 'DELETE' })
    toast.success('Block deleted')
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <Card>
        <CardContent className="p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1.5" /> Pages</Button>
            <div className="h-6 w-px bg-border" />
            <div><p className="text-sm font-semibold">{page.title}</p><p className="text-[10px] text-muted-foreground">creatoros.io/{page.slug}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border p-0.5">
              <button onClick={() => setDevice('desktop')} className={cn('rounded p-1.5', device === 'desktop' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}><Monitor className="h-3.5 w-3.5" /></button>
              <button onClick={() => setDevice('mobile')} className={cn('rounded p-1.5', device === 'mobile' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}><Smartphone className="h-3.5 w-3.5" /></button>
            </div>
            {saving && <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Saving</span>}
            <Button size="sm" onClick={() => toast.success('Page published', { description: 'Your changes are live.' })}><Globe className="h-3.5 w-3.5 mr-1.5" />Publish</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        {/* Blocks sidebar */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Blocks</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {loading ? <Skeleton className="h-8" /> : blocks.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No blocks yet. Add one to start building.</p>
              ) : blocks.map((b, i) => {
                const meta = BLOCK_TYPES.find((t) => t.type === b.type)
                const Icon = meta?.icon || Layout
                const isEditing = editingBlock?.id === b.id
                return (
                  <button key={b.id} onClick={() => setEditingBlock(isEditing ? null : b)}
                    className={cn('group flex w-full items-center gap-2 rounded-lg p-2 text-left transition', isEditing ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-muted')}>
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    <Icon className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs font-medium flex-1 truncate">{meta?.name || b.type}</span>
                    <span className="text-[10px] text-muted-foreground">{i + 1}</span>
                  </button>
                )
              })}
            </CardContent>
          </Card>
          <Button className="w-full" variant="outline" size="sm" onClick={() => setShowAddPanel(true)}><Plus className="h-4 w-4 mr-1.5" /> Add Block</Button>
        </div>

        {/* Live preview */}
        <div className={cn('mx-auto transition-all', device === 'mobile' ? 'max-w-[390px]' : 'w-full max-w-3xl')}>
          <div className="rounded-xl border bg-white dark:bg-zinc-950 overflow-hidden shadow-sm min-h-[500px]">
            {loading ? (
              <div className="p-8 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
            ) : blocks.length === 0 ? (
              <div className="p-12 text-center">
                <Layout className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Start building your page</p>
                <p className="text-xs text-zinc-500 mt-1">Add blocks from the sidebar to create your layout.</p>
                <Button size="sm" className="mt-3" onClick={() => setShowAddPanel(true)}><Plus className="h-4 w-4 mr-1.5" /> Add your first block</Button>
              </div>
            ) : (
              blocks.map((b) => (
                <div key={b.id} className="group relative" onClick={() => setEditingBlock(b)}>
                  {editingBlock?.id === b.id && <div className="absolute inset-0 ring-2 ring-primary ring-inset z-10 rounded" />}
                  <BlockPreview block={b} />
                  <button onClick={(e) => { e.stopPropagation(); deleteBlock(b.id) }} className="absolute top-2 right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition hover:bg-rose-600">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Block editor panel */}
      <AnimatePresence>
        {editingBlock && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            <BlockEditor block={editingBlock} onUpdate={(c) => { updateBlock(editingBlock.id, c); setEditingBlock({ ...editingBlock, content: c }) }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add block panel */}
      <AnimatePresence>
        {showAddPanel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAddPanel(false)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl">
              <Card>
                <CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Add a block</CardTitle><Button variant="ghost" size="icon" onClick={() => setShowAddPanel(false)}>✕</Button></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {BLOCK_TYPES.map((t) => { const Icon = t.icon; return (
                      <button key={t.type} onClick={() => addBlock(t.type)} disabled={saving}
                        className="group flex flex-col items-center gap-2 rounded-xl border p-4 hover:border-primary/40 hover:bg-primary/5 transition disabled:opacity-50">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary group-hover:scale-110 transition"><Icon className="h-5 w-5" /></div>
                        <p className="text-xs font-medium">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground text-center">{t.desc}</p>
                      </button>
                    )})}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function getDefaultBlockContent(type: string): Record<string, unknown> {
  switch (type) {
    case 'HERO': return { headline: 'Your compelling headline here', subheadline: 'A subheadline that explains your value proposition clearly.', ctaText: 'Get Started', ctaSecondary: 'Learn more', emoji: '🚀' }
    case 'HEADING': return { text: 'Section Heading', alignment: 'center' }
    case 'TEXT': return { text: 'Write your paragraph here. You can edit this text in the block editor below.' }
    case 'FEATURES': return { heading: 'Why choose us', subheading: 'Everything you need, nothing you don\'t', items: [{ icon: '✨', title: 'Feature One', description: 'Describe the first benefit.' }, { icon: '⚡', title: 'Feature Two', description: 'Describe the second benefit.' }, { icon: '🎯', title: 'Feature Three', description: 'Describe the third benefit.' }] }
    case 'PRICING': return { heading: 'Simple pricing', plans: [{ name: 'Basic', price: 0, interval: 'free', features: ['Feature 1', 'Feature 2'], cta: 'Get started', highlighted: false }, { name: 'Pro', price: 49, interval: '/mo', features: ['Everything in Basic', 'Feature 3', 'Feature 4'], cta: 'Start trial', highlighted: true }] }
    case 'TESTIMONIALS': return { heading: 'Loved by creators', items: [{ name: 'Sarah K.', role: 'YouTuber', quote: 'This changed my whole workflow.' }, { name: 'Marcus T.', role: 'Coach', quote: 'Best investment I made this year.' }] }
    case 'CTA': return { headline: 'Ready to get started?', subtext: 'Join thousands of creators already using our platform.', ctaText: 'Start free today' }
    case 'FAQ': return { heading: 'Frequently asked questions', items: [{ question: 'Is there a free trial?', answer: 'Yes! You can start free, no credit card required.' }, { question: 'Can I cancel anytime?', answer: 'Absolutely. Cancel with one click, no questions asked.' }] }
    case 'IMAGE': return { url: '', alt: 'Image description', caption: '' }
    default: return {}
  }
}

// ===== Block live preview (renders on white canvas) =====
function BlockPreview({ block }: { block: Block }) {
  const c = block.content
  const textClass = 'text-zinc-900 dark:text-zinc-100'
  const mutedClass = 'text-zinc-500 dark:text-zinc-400'

  switch (block.type) {
    case 'HERO': {
      const d = c as { headline?: string; subheadline?: string; ctaText?: string; ctaSecondary?: string; emoji?: string }
      return (
        <div className="px-8 py-16 text-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
          {d.emoji && <div className="text-4xl mb-4">{d.emoji}</div>}
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-zinc-900 dark:text-white">{d.headline}</h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto mb-6">{d.subheadline}</p>
          <div className="flex gap-2 justify-center">
            {d.ctaText && <button className="rounded-lg bg-zinc-900 text-white px-5 py-2.5 text-sm font-medium dark:bg-white dark:text-zinc-900">{d.ctaText}</button>}
            {d.ctaSecondary && <button className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">{d.ctaSecondary}</button>}
          </div>
        </div>
      )
    }
    case 'HEADING': {
      const d = c as { text?: string; alignment?: string }
      return <div className="px-8 py-6"><h2 className={cn('text-2xl font-bold text-zinc-900 dark:text-white', d.alignment === 'center' && 'text-center')}>{d.text}</h2></div>
    }
    case 'TEXT': {
      const d = c as { text?: string }
      return <div className="px-8 py-4"><p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{d.text}</p></div>
    }
    case 'FEATURES': {
      const d = c as { heading?: string; subheading?: string; items?: { icon?: string; title?: string; description?: string }[] }
      return (
        <div className="px-8 py-12">
          <div className="text-center mb-8"><h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{d.heading}</h2>{d.subheading && <p className="text-sm text-zinc-500 mt-1">{d.subheading}</p>}</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {d.items?.map((it, i) => (
              <div key={i} className="text-center"><div className="text-3xl mb-2">{it.icon}</div><p className="font-semibold text-sm text-zinc-900 dark:text-white">{it.title}</p><p className="text-xs text-zinc-500 mt-1">{it.description}</p></div>
            ))}
          </div>
        </div>
      )
    }
    case 'PRICING': {
      const d = c as { heading?: string; plans?: { name?: string; price?: number; interval?: string; features?: string[]; cta?: string; highlighted?: boolean }[] }
      return (
        <div className="px-8 py-12">
          <div className="text-center mb-8"><h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{d.heading}</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {d.plans?.map((p, i) => (
              <div key={i} className={cn('rounded-xl border p-5', p.highlighted ? 'border-zinc-900 dark:border-white ring-2 ring-zinc-900/10 dark:ring-white/10' : 'border-zinc-200 dark:border-zinc-800')}>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">{p.name}</p>
                <div className="mt-2 flex items-baseline gap-1"><span className="text-3xl font-bold text-zinc-900 dark:text-white">${p.price}</span><span className="text-xs text-zinc-500">{p.interval}</span></div>
                <ul className="mt-3 space-y-1">{p.features?.map((f, fi) => <li key={fi} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5"><span className="text-emerald-500">✓</span>{f}</li>)}</ul>
                <button className={cn('mt-4 w-full rounded-lg py-2 text-sm font-medium', p.highlighted ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300')}>{p.cta}</button>
              </div>
            ))}
          </div>
        </div>
      )
    }
    case 'TESTIMONIALS': {
      const d = c as { heading?: string; items?: { name?: string; role?: string; quote?: string }[] }
      return (
        <div className="px-8 py-12 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="text-center mb-6"><h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{d.heading}</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {d.items?.map((t, i) => (
              <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
                <div className="flex gap-0.5 text-amber-400 mb-2">{Array.from({ length: 5 }).map((_, s) => <Star key={s} className="h-3 w-3 fill-current" />)}</div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 italic">"{t.quote}"</p>
                <p className="text-xs text-zinc-500 mt-2">— {t.name}, {t.role}</p>
              </div>
            ))}
          </div>
        </div>
      )
    }
    case 'CTA': {
      const d = c as { headline?: string; subtext?: string; ctaText?: string }
      return (
        <div className="px-8 py-14 text-center bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-900 dark:to-black">
          <h2 className="text-2xl font-bold text-white mb-2">{d.headline}</h2>
          <p className="text-sm text-zinc-300 max-w-md mx-auto mb-5">{d.subtext}</p>
          <button className="rounded-lg bg-white text-zinc-900 px-6 py-2.5 text-sm font-medium">{d.ctaText}</button>
        </div>
      )
    }
    case 'FAQ': {
      const d = c as { heading?: string; items?: { question?: string; answer?: string }[] }
      return (
        <div className="px-8 py-12 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white text-center mb-6">{d.heading}</h2>
          <div className="space-y-3">{d.items?.map((f, i) => (
            <div key={i} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3"><p className="text-sm font-medium text-zinc-900 dark:text-white">{f.question}</p><p className="text-xs text-zinc-500 mt-1">{f.answer}</p></div>
          ))}</div>
        </div>
      )
    }
    case 'IMAGE': {
      const d = c as { url?: string; alt?: string; caption?: string }
      return (
        <div className="px-8 py-6">
          {d.url ? (
            <img src={d.url} alt={d.alt || ''} className="rounded-lg w-full" />
          ) : (
            <div className="rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 h-48 flex items-center justify-center text-zinc-400"><ImageIcon className="h-8 w-8" /></div>
          )}
          {d.caption && <p className="text-xs text-zinc-500 text-center mt-2">{d.caption}</p>}
        </div>
      )
    }
    default: return <div className="p-4 text-xs text-zinc-400">Unknown block</div>
  }
}

// ===== Block editor form =====
function BlockEditor({ block, onUpdate }: { block: Block; onUpdate: (c: Record<string, unknown>) => void }) {
  const [c, setC] = useState(block.content)
  const set = (k: string, v: unknown) => { const next = { ...c, [k]: v }; setC(next); onUpdate(next) }

  const fields = getBlockFields(block.type)
  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Save className="h-4 w-4 text-primary" />Edit {block.type} block <span className="text-xs text-muted-foreground font-normal ml-auto">Auto-saves on change</span></CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {fields.map((f) => (
          <div key={f.key}>
            <Label className="text-xs">{f.label}</Label>
            {f.type === 'text' && <Input className="mt-1 h-8 text-sm" value={String(c[f.key] ?? '')} onChange={(e) => set(f.key, e.target.value)} />}
            {f.type === 'textarea' && <Textarea className="mt-1 text-sm" rows={3} value={String(c[f.key] ?? '')} onChange={(e) => set(f.key, e.target.value)} />}
            {f.type === 'number' && <Input type="number" className="mt-1 h-8 text-sm" value={Number(c[f.key] ?? 0)} onChange={(e) => set(f.key, Number(e.target.value))} />}
          </div>
        ))}
        {block.type === 'FEATURES' && <FeatureEditor content={c} onUpdate={(next) => { setC(next); onUpdate(next) }} />}
        {block.type === 'PRICING' && <PricingEditor content={c} onUpdate={(next) => { setC(next); onUpdate(next) }} />}
        {block.type === 'TESTIMONIALS' && <TestimonialsEditor content={c} onUpdate={(next) => { setC(next); onUpdate(next) }} />}
        {block.type === 'FAQ' && <FaqEditor content={c} onUpdate={(next) => { setC(next); onUpdate(next) }} />}
      </CardContent>
    </Card>
  )
}

function getBlockFields(type: string): { key: string; label: string; type: 'text' | 'textarea' | 'number' }[] {
  switch (type) {
    case 'HERO': return [{ key: 'emoji', label: 'Emoji', type: 'text' }, { key: 'headline', label: 'Headline', type: 'text' }, { key: 'subheadline', label: 'Subheadline', type: 'textarea' }, { key: 'ctaText', label: 'Primary CTA', type: 'text' }, { key: 'ctaSecondary', label: 'Secondary CTA', type: 'text' }]
    case 'HEADING': return [{ key: 'text', label: 'Heading text', type: 'text' }]
    case 'TEXT': return [{ key: 'text', label: 'Paragraph', type: 'textarea' }]
    case 'CTA': return [{ key: 'headline', label: 'Headline', type: 'text' }, { key: 'subtext', label: 'Subtext', type: 'textarea' }, { key: 'ctaText', label: 'Button text', type: 'text' }]
    case 'FEATURES': return [{ key: 'heading', label: 'Heading', type: 'text' }, { key: 'subheading', label: 'Subheading', type: 'text' }]
    case 'PRICING': return [{ key: 'heading', label: 'Heading', type: 'text' }]
    case 'TESTIMONIALS': return [{ key: 'heading', label: 'Heading', type: 'text' }]
    case 'FAQ': return [{ key: 'heading', label: 'Heading', type: 'text' }]
    case 'IMAGE': return [{ key: 'url', label: 'Image URL', type: 'text' }, { key: 'alt', label: 'Alt text', type: 'text' }, { key: 'caption', label: 'Caption', type: 'text' }]
    default: return []
  }
}

function FeatureEditor({ content, onUpdate }: { content: Record<string, unknown>; onUpdate: (c: Record<string, unknown>) => void }) {
  const items = (content.items as { icon?: string; title?: string; description?: string }[]) || []
  return (
    <div>
      <Label className="text-xs">Feature Items</Label>
      <div className="space-y-2 mt-1">
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-[60px_1fr_1fr] gap-2">
            <Input className="h-8 text-sm" value={it.icon || ''} onChange={(e) => { const next = [...items]; next[i] = { ...it, icon: e.target.value }; onUpdate({ ...content, items: next }) }} />
            <Input className="h-8 text-sm" placeholder="Title" value={it.title || ''} onChange={(e) => { const next = [...items]; next[i] = { ...it, title: e.target.value }; onUpdate({ ...content, items: next }) }} />
            <Input className="h-8 text-sm" placeholder="Description" value={it.description || ''} onChange={(e) => { const next = [...items]; next[i] = { ...it, description: e.target.value }; onUpdate({ ...content, items: next }) }} />
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => onUpdate({ ...content, items: [...items, { icon: '✨', title: '', description: '' }] })}><Plus className="h-3 w-3 mr-1" />Add feature</Button>
      </div>
    </div>
  )
}

function PricingEditor({ content, onUpdate }: { content: Record<string, unknown>; onUpdate: (c: Record<string, unknown>) => void }) {
  const plans = (content.plans as { name?: string; price?: number; interval?: string; features?: string[]; cta?: string; highlighted?: boolean }[]) || []
  return (
    <div>
      <Label className="text-xs">Pricing Plans</Label>
      <div className="space-y-2 mt-1">
        {plans.map((p, i) => (
          <div key={i} className="rounded-lg border p-2 space-y-1.5">
            <div className="grid grid-cols-3 gap-2">
              <Input className="h-8 text-sm" placeholder="Name" value={p.name || ''} onChange={(e) => { const next = [...plans]; next[i] = { ...p, name: e.target.value }; onUpdate({ ...content, plans: next }) }} />
              <Input type="number" className="h-8 text-sm" placeholder="$" value={p.price ?? 0} onChange={(e) => { const next = [...plans]; next[i] = { ...p, price: Number(e.target.value) }; onUpdate({ ...content, plans: next }) }} />
              <Input className="h-8 text-sm" placeholder="/mo" value={p.interval || ''} onChange={(e) => { const next = [...plans]; next[i] = { ...p, interval: e.target.value }; onUpdate({ ...content, plans: next }) }} />
            </div>
            <Input className="h-8 text-sm" placeholder="CTA button text" value={p.cta || ''} onChange={(e) => { const next = [...plans]; next[i] = { ...p, cta: e.target.value }; onUpdate({ ...content, plans: next }) }} />
            <Textarea className="text-sm" rows={2} placeholder="Features (one per line)" value={(p.features || []).join('\n')} onChange={(e) => { const next = [...plans]; next[i] = { ...p, features: e.target.value.split('\n') }; onUpdate({ ...content, plans: next }) }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function TestimonialsEditor({ content, onUpdate }: { content: Record<string, unknown>; onUpdate: (c: Record<string, unknown>) => void }) {
  const items = (content.items as { name?: string; role?: string; quote?: string }[]) || []
  return (
    <div>
      <Label className="text-xs">Testimonials</Label>
      <div className="space-y-2 mt-1">
        {items.map((t, i) => (
          <div key={i} className="rounded-lg border p-2 space-y-1.5">
            <div className="grid grid-cols-2 gap-2">
              <Input className="h-8 text-sm" placeholder="Name" value={t.name || ''} onChange={(e) => { const next = [...items]; next[i] = { ...t, name: e.target.value }; onUpdate({ ...content, items: next }) }} />
              <Input className="h-8 text-sm" placeholder="Role" value={t.role || ''} onChange={(e) => { const next = [...items]; next[i] = { ...t, role: e.target.value }; onUpdate({ ...content, items: next }) }} />
            </div>
            <Textarea className="text-sm" rows={2} placeholder="Quote" value={t.quote || ''} onChange={(e) => { const next = [...items]; next[i] = { ...t, quote: e.target.value }; onUpdate({ ...content, items: next }) }} />
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => onUpdate({ ...content, items: [...items, { name: '', role: '', quote: '' }] })}><Plus className="h-3 w-3 mr-1" />Add testimonial</Button>
      </div>
    </div>
  )
}

function FaqEditor({ content, onUpdate }: { content: Record<string, unknown>; onUpdate: (c: Record<string, unknown>) => void }) {
  const items = (content.items as { question?: string; answer?: string }[]) || []
  return (
    <div>
      <Label className="text-xs">FAQ Items</Label>
      <div className="space-y-2 mt-1">
        {items.map((f, i) => (
          <div key={i} className="rounded-lg border p-2 space-y-1.5">
            <Input className="h-8 text-sm" placeholder="Question" value={f.question || ''} onChange={(e) => { const next = [...items]; next[i] = { ...f, question: e.target.value }; onUpdate({ ...content, items: next }) }} />
            <Textarea className="text-sm" rows={2} placeholder="Answer" value={f.answer || ''} onChange={(e) => { const next = [...items]; next[i] = { ...f, answer: e.target.value }; onUpdate({ ...content, items: next }) }} />
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => onUpdate({ ...content, items: [...items, { question: '', answer: '' }] })}><Plus className="h-3 w-3 mr-1" />Add question</Button>
      </div>
    </div>
  )
}
