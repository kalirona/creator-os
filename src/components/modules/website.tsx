'use client'
import { motion } from 'framer-motion'
import { Globe, Eye, Plus, Layout, FileText, ShoppingCart, Info, Mail, ExternalLink, Sparkles, Search } from 'lucide-react'
import { useApi, formatNumber } from '@/hooks/use-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'

interface Data {
  stats: { pages: number; totalVisits: number; published: number }
  pages: { id: string; title: string; slug: string; type: string; status: string; visits: number }[]
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

export function WebsiteModule() {
  const { data, loading } = useApi<Data>('/api/data/website')
  const setActiveModule = useAppStore((s) => s.setActiveModule)
  if (loading || !data) return <Skeleton className="h-96 rounded-xl" />

  const templates = [
    { name: 'Product Launch', desc: 'High-converting landing page for digital products', color: 'from-emerald-500/20 to-teal-500/10' },
    { name: 'Course Sales', desc: 'Long-form sales page with testimonials', color: 'from-violet-500/20 to-fuchsia-500/10' },
    { name: 'Webinar Registration', desc: 'Capture leads for live or evergreen webinars', color: 'from-amber-500/20 to-orange-500/10' },
    { name: 'Lead Magnet', desc: 'Free download opt-in page', color: 'from-sky-500/20 to-cyan-500/10' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Build landing pages, sales pages, and your public site.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setActiveModule('ai-studio')}><Sparkles className="h-4 w-4 mr-1.5 text-primary" /> AI Landing Page</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> New Page</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Pages', value: String(data.stats.pages), icon: FileText },
          { label: 'Total Visits', value: formatNumber(data.stats.totalVisits, true), icon: Eye },
          { label: 'Published', value: String(data.stats.published), icon: Globe },
          { label: 'Avg Conversion', value: '4.2%', icon: ShoppingCart },
        ].map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}><CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary"><Icon className="h-4 w-4" /></div>
              <div><p className="text-lg font-bold tabular-nums leading-none">{s.value}</p><p className="text-[11px] text-muted-foreground mt-1">{s.label}</p></div>
            </CardContent></Card>
          )
        })}
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
                  <Button size="sm" variant="ghost" className="h-7 text-xs opacity-0 group-hover:opacity-100">Edit</Button>
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
                <button key={t.name} className="group w-full text-left rounded-lg border p-3 hover:border-primary/40 hover:shadow-sm transition">
                  <div className={cn('mb-2 h-16 rounded-md bg-gradient-to-br', t.color)} />
                  <p className="text-xs font-semibold">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{t.desc}</p>
                </button>
              ))}
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-primary/10 to-card border-primary/20">
            <CardContent className="p-4">
              <p className="text-xs font-semibold flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-primary" />Custom Domain</p>
              <p className="text-xs text-muted-foreground mt-1">Connect your own domain for a branded experience.</p>
              <Button size="sm" variant="outline" className="mt-3 w-full"><ExternalLink className="h-3.5 w-3.5 mr-1.5" />Connect domain</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
