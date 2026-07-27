'use client'
import { motion } from 'framer-motion'
import { LifeBuoy, MessageCircle, BookOpen, Video, Send, Search, Clock, CheckCircle2, AlertCircle, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const TICKETS = [
  { id: 'T-1042', subject: 'Cannot download my purchase', customer: 'Emma Smith', status: 'Open', priority: 'High', time: '12m ago' },
  { id: 'T-1041', subject: 'How to issue a refund?', customer: 'Liam Johnson', status: 'Open', priority: 'Medium', time: '1h ago' },
  { id: 'T-1040', subject: 'Course video not loading', customer: 'Olivia Brown', status: 'In Progress', priority: 'High', time: '2h ago' },
  { id: 'T-1039', subject: 'Affiliate payout question', customer: 'Noah Garcia', status: 'Resolved', priority: 'Low', time: '5h ago' },
  { id: 'T-1038', subject: 'Change billing email', customer: 'Ava Miller', status: 'Resolved', priority: 'Low', time: '1d ago' },
]
const STATUS_CLS: Record<string, string> = { Open: 'bg-rose-500/10 text-rose-600', 'In Progress': 'bg-amber-500/10 text-amber-600', Resolved: 'bg-emerald-500/10 text-emerald-600' }
const PRIO_CLS: Record<string, string> = { High: 'bg-rose-500/10 text-rose-600', Medium: 'bg-amber-500/10 text-amber-600', Low: 'bg-muted text-muted-foreground' }

const HELP_CATS = [
  { icon: BookOpen, label: 'Getting Started', count: 24, color: 'text-emerald-600 bg-emerald-500/10' },
  { icon: Video, label: 'Courses & Lessons', count: 18, color: 'text-violet-600 bg-violet-500/10' },
  { icon: MessageCircle, label: 'Community', count: 12, color: 'text-sky-600 bg-sky-500/10' },
  { icon: LifeBuoy, label: 'Billing & Plans', count: 15, color: 'text-amber-600 bg-amber-500/10' },
]

export function SupportModule() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Open Tickets', value: '7', icon: AlertCircle, color: 'text-rose-500' },
          { label: 'Avg Response', value: '2.4h', icon: Clock, color: 'text-amber-500' },
          { label: 'Resolved (7d)', value: '42', icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Satisfaction', value: '98%', icon: MessageCircle, color: 'text-primary' },
        ].map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}><CardContent className="p-4 flex items-center gap-3">
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg bg-muted', s.color)}><Icon className="h-4 w-4" /></div>
              <div><p className="text-lg font-bold tabular-nums leading-none">{s.value}</p><p className="text-[11px] text-muted-foreground mt-1">{s.label}</p></div>
            </CardContent></Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* Tickets */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-base">Support Tickets</CardTitle>
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> New Ticket</Button>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="relative mb-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search tickets..." className="pl-9" /></div>
            {TICKETS.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="group flex items-center gap-3 rounded-lg p-3 hover:bg-muted/50 transition cursor-pointer">
                <Avatar className="h-8 w-8"><AvatarFallback className="bg-muted text-[10px]">{t.customer.split(' ').map((n) => n[0]).join('').slice(0, 2)}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className="text-[10px] font-mono text-muted-foreground">{t.id}</span><p className="text-sm font-medium truncate">{t.subject}</p></div>
                  <p className="text-xs text-muted-foreground truncate">{t.customer} · {t.time}</p>
                </div>
                <Badge variant="secondary" className={cn('text-[10px]', PRIO_CLS[t.priority])}>{t.priority}</Badge>
                <Badge variant="secondary" className={cn('text-[10px]', STATUS_CLS[t.status])}>{t.status}</Badge>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Help center + live chat */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Help Center</CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              {HELP_CATS.map((c) => {
                const Icon = c.icon
                return (
                  <button key={c.label} className="flex w-full items-center gap-2.5 rounded-lg p-2.5 hover:bg-muted/50 transition text-left">
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', c.color)}><Icon className="h-4 w-4" /></div>
                    <span className="flex-1 text-xs font-medium">{c.label}</span>
                    <span className="text-[10px] text-muted-foreground">{c.count} articles</span>
                  </button>
                )
              })}
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-primary/10 to-card border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"><MessageCircle className="h-4 w-4" /></div><div><p className="text-sm font-semibold">Live Chat</p><p className="text-[10px] text-emerald-500 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Online now</p></div></div>
              <p className="text-xs text-muted-foreground mt-2">Average response time: under 2 minutes during business hours.</p>
              <Button size="sm" className="mt-3 w-full"><Send className="h-3.5 w-3.5 mr-1.5" />Start a chat</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
