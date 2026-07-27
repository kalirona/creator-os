'use client'
import { motion } from 'framer-motion'
import { Mail, Send, Users, MousePointer, Eye, Plus, Sparkles, Clock, CheckCircle2, Calendar, Zap } from 'lucide-react'
import { useApi, formatNumber } from '@/hooks/use-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/hooks/use-api'

interface Data {
  stats: { subscribers: number; campaigns: number; totalSent: number; avgOpen: number; avgClick: number }
  campaigns: { id: string; name: string; subject: string; type: string; status: string; recipients: number; openRate: number; clickRate: number; date: string }[]
}

const TYPE_META: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  BROADCAST: { icon: Send, color: 'text-sky-600 bg-sky-500/10' },
  AUTOMATION: { icon: Zap, color: 'text-violet-600 bg-violet-500/10' },
  SEQUENCE: { icon: Clock, color: 'text-amber-600 bg-amber-500/10' },
}
const STATUS_META: Record<string, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  SENT: { label: 'Sent', cls: 'bg-emerald-500/10 text-emerald-600', icon: CheckCircle2 },
  DRAFT: { label: 'Draft', cls: 'bg-muted text-muted-foreground', icon: Mail },
  SCHEDULED: { label: 'Scheduled', cls: 'bg-amber-500/10 text-amber-600', icon: Calendar },
}

export function EmailModule() {
  const { data, loading } = useApi<Data>('/api/data/email')
  const setActiveModule = useAppStore((s) => s.setActiveModule)

  if (loading || !data) return <Skeleton className="h-96 rounded-xl" />

  const kpis = [
    { label: 'Subscribers', value: formatNumber(data.stats.subscribers, true), icon: Users, delta: '+342 this week' },
    { label: 'Avg Open Rate', value: `${(data.stats.avgOpen * 100).toFixed(1)}%`, icon: Eye, delta: '+2.4%' },
    { label: 'Avg Click Rate', value: `${(data.stats.avgClick * 100).toFixed(1)}%`, icon: MousePointer, delta: '+0.8%' },
    { label: 'Emails Sent', value: formatNumber(data.stats.totalSent, true), icon: Send, delta: '30 days' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Grow and nurture your audience with broadcasts, automations, and sequences.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setActiveModule('ai-studio')}>
            <Sparkles className="h-4 w-4 mr-1.5 text-primary" /> AI Email Writer
          </Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> New Campaign</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <Card key={k.label}><CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary"><Icon className="h-4 w-4" /></div>
                <span className="text-[11px] text-muted-foreground">{k.delta}</span>
              </div>
              <p className="text-2xl font-bold tabular-nums">{k.value}</p>
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </CardContent></Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Campaigns</CardTitle></CardHeader>
          <CardContent className="space-y-1.5">
            {data.campaigns.map((c, i) => {
              const tm = TYPE_META[c.type] || TYPE_META.BROADCAST
              const sm = STATUS_META[c.status] || STATUS_META.DRAFT
              const TIcon = tm.icon; const SIcon = sm.icon
              return (
                <motion.div key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="group flex items-center gap-3 rounded-lg p-3 hover:bg-muted/50 transition cursor-pointer">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', tm.color)}><TIcon className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <Badge variant="secondary" className={cn('text-[10px]', sm.cls)}><SIcon className="h-2.5 w-2.5 mr-1" />{sm.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{c.subject}</p>
                  </div>
                  {c.status === 'SENT' ? (
                    <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="text-right"><p className="font-medium text-foreground tabular-nums">{formatNumber(c.recipients, true)}</p><p>recipients</p></div>
                      <div className="text-right"><p className="font-medium text-foreground tabular-nums">{(c.openRate * 100).toFixed(0)}%</p><p>opens</p></div>
                      <div className="text-right"><p className="font-medium text-foreground tabular-nums">{(c.clickRate * 100).toFixed(0)}%</p><p>clicks</p></div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">{timeAgo(c.date)}</span>
                  )}
                </motion.div>
              )
            })}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Automations</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[
                { name: 'Welcome Sequence', status: 'Active', enrolled: 840 },
                { name: 'Abandoned Cart', status: 'Active', enrolled: 124 },
                { name: 'Post-Purchase', status: 'Active', enrolled: 320 },
                { name: 'Re-engagement', status: 'Paused', enrolled: 0 },
              ].map((a) => (
                <div key={a.name} className="flex items-center justify-between rounded-lg p-2.5 hover:bg-muted/50 transition">
                  <div><p className="text-xs font-medium">{a.name}</p><p className="text-[10px] text-muted-foreground">{a.enrolled} enrolled</p></div>
                  <Badge variant="secondary" className={cn('text-[10px]', a.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted')}>{a.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-primary/10 to-card border-primary/20">
            <CardContent className="p-4">
              <Sparkles className="h-5 w-5 text-primary mb-2" />
              <p className="text-sm font-semibold">AI Email Writer</p>
              <p className="text-xs text-muted-foreground mt-1">Generate high-converting emails in seconds with proven frameworks.</p>
              <Button size="sm" className="mt-3 w-full" onClick={() => setActiveModule('ai-studio')}>Try it now</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
