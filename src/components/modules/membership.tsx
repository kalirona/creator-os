'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Crown, Users, DollarSign, TrendingUp, Plus, Check, Zap } from 'lucide-react'
import { useApi, formatCurrency, formatNumber } from '@/hooks/use-api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { MetricCard } from '@/components/ui-enterprise/MetricCard'
import { LoadingState } from '@/components/ui-enterprise/LoadingState'
import { ErrorState } from '@/components/ui-enterprise/ErrorState'

interface Data {
  stats: { totalMembers: number; mrr: number; lifetime: number; arr: number; plans: number }
  plans: { id: string; name: string; price: number; interval: string; members: number; status: string }[]
}

const INTERVAL_LABEL: Record<string, string> = { MONTHLY: '/mo', YEARLY: '/yr', LIFETIME: ' once' }
const PLAN_COLORS: Record<string, string> = {
  Free: 'from-muted to-muted/50',
  Pro: 'from-primary/20 to-primary/5',
  'Pro Annual': 'from-violet-500/20 to-fuchsia-500/5',
  Lifetime: 'from-amber-500/20 to-orange-500/5',
}

export function MembershipModule() {
  const { data, loading, error, refetch } = useApi<Data>('/api/data/membership')
  const [showCreatePlan, setShowCreatePlan] = useState(false)
  const [newPlanName, setNewPlanName] = useState('')
  const [newPlanPrice, setNewPlanPrice] = useState('')
  const [newPlanInterval, setNewPlanInterval] = useState('MONTHLY')
  const [saving, setSaving] = useState(false)

  const createPlan = async () => {
    if (!newPlanName.trim()) { toast.error('Plan name is required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/data/membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlanName.trim(), price: parseFloat(newPlanPrice) || 0, interval: newPlanInterval }),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Failed') }
      toast.success('Plan created', { description: `"${newPlanName}" is now available.` })
      setNewPlanName(''); setNewPlanPrice(''); setNewPlanInterval('MONTHLY'); setShowCreatePlan(false)
      refetch()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } finally { setSaving(false) }
  }

  if (loading) return <LoadingState size="lg" text="Loading membership data..." />
  if (error || !data) return <ErrorState description={error || 'Failed to load membership data.'} action={{ label: 'Retry', onClick: refetch }} />

  const kpis = [
    { label: 'Total Members', value: formatNumber(data.stats.totalMembers, true), icon: Users, delta: '+342' },
    { label: 'MRR', value: formatCurrency(data.stats.mrr, { compact: true }), icon: DollarSign, delta: '+8.2%' },
    { label: 'ARR', value: formatCurrency(data.stats.arr, { compact: true }), icon: TrendingUp, delta: '+8.2%' },
    { label: 'Lifetime Revenue', value: formatCurrency(data.stats.lifetime, { compact: true }), icon: Crown, delta: '92 members' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Recurring revenue plans and member tiers.</p>
        <Button size="sm" onClick={() => setShowCreatePlan(true)}><Plus className="h-4 w-4 mr-1.5" /> New Plan</Button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <MetricCard
            key={k.label}
            title={k.label}
            value={k.value}
            change={k.delta}
            changeType="increase"
            icon={<k.icon className="h-5 w-5" />}
          />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.plans.map((p, i) => {
          const isPro = p.name === 'Pro'
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className={cn('relative overflow-hidden h-full', isPro && 'ring-2 ring-primary')}>
                {isPro && <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground"><Zap className="h-2.5 w-2.5 mr-1" />Popular</Badge>}
                <div className={cn('h-20 bg-gradient-to-br flex items-center justify-center', PLAN_COLORS[p.name] || 'from-muted to-muted/50')}>
                  <Crown className={cn('h-8 w-8', isPro ? 'text-primary' : 'text-muted-foreground')} />
                </div>
                <CardContent className="p-5">
                  <p className="font-semibold">{p.name}</p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-3xl font-bold tabular-nums">{p.price === 0 ? 'Free' : formatCurrency(p.price)}</span>
                    {p.price > 0 && <span className="text-xs text-muted-foreground">{INTERVAL_LABEL[p.interval]}</span>}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{formatNumber(p.members)} active members</p>
                  <div className="mt-4 space-y-1.5">
                    {['All community access', 'Weekly newsletter', p.price > 0 && 'All courses & products', p.price > 199 && 'Weekly office hours', p.price > 1000 && 'Lifetime updates'].filter(Boolean).map((f) => (
                      <div key={f as string} className="flex items-center gap-2 text-xs"><Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /><span className="text-muted-foreground">{f}</span></div>
                    ))}
                  </div>
                  <Button className="mt-4 w-full" size="sm" variant={isPro ? 'default' : 'outline'} onClick={() => toast.info(`Managing "${p.name}" plan`, { description: 'Edit pricing, features, and benefits.' })}>Manage plan</Button>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <Dialog open={showCreatePlan} onOpenChange={setShowCreatePlan}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Membership Plan</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Plan name</Label>
              <Input value={newPlanName} onChange={(e) => setNewPlanName(e.target.value)} placeholder="e.g. Pro, Premium, Elite" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Price (USD)</Label>
                <Input type="number" value={newPlanPrice} onChange={(e) => setNewPlanPrice(e.target.value)} placeholder="29" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Billing</Label>
                <Select value={newPlanInterval} onValueChange={setNewPlanInterval}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                    <SelectItem value="LIFETIME">Lifetime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreatePlan(false)}>Cancel</Button>
            <Button onClick={createPlan} disabled={saving}>
              {saving ? 'Creating...' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}