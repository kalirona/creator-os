'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart, Tag, Receipt, RotateCcw, DollarSign, Package, Percent, Plus, Download, Search } from 'lucide-react'
import { useApi, formatCurrency, formatNumber } from '@/hooks/use-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Data {
  pages: { id: string; title: string; slug: string; type: string; status: string; visits: number }[]
  plans: { id: string; name: string; price: number; interval: string; members: number; status: string }[]
}

export function StoreModule() {
  const { data, loading } = useApi<Data>('/api/data/store')
  const [coupon, setCoupon] = useState('')
  if (loading || !data) return <Skeleton className="h-96 rounded-xl" />

  const coupons = [
    { code: 'LAUNCH50', discount: '50%', uses: 142, limit: 500, status: 'Active' },
    { code: 'WELCOME20', discount: '20%', uses: 89, limit: 1000, status: 'Active' },
    { code: 'BLACKFRIDAY', discount: '60%', uses: 540, limit: 540, status: 'Expired' },
  ]
  const invoices = [
    { id: 'INV-2025-0142', customer: 'Emma Smith', amount: 199, status: 'Paid', date: '2 hours ago' },
    { id: 'INV-2025-0141', customer: 'Liam Johnson', amount: 49, status: 'Paid', date: '5 hours ago' },
    { id: 'INV-2025-0140', customer: 'Olivia Brown', amount: 499, status: 'Paid', date: '8 hours ago' },
    { id: 'INV-2025-0139', customer: 'Noah Garcia', amount: 79, status: 'Refunded', date: '1 day ago' },
    { id: 'INV-2025-0138', customer: 'Ava Miller', amount: 149, status: 'Paid', date: '1 day ago' },
  ]
  const STATUS_CLS: Record<string, string> = { Paid: 'bg-emerald-500/10 text-emerald-600', Refunded: 'bg-rose-500/10 text-rose-600', Active: 'bg-emerald-500/10 text-emerald-600', Expired: 'bg-muted text-muted-foreground' }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Store Revenue', value: formatCurrency(28430, { compact: true }), icon: DollarSign, delta: '+18%' },
          { label: 'Orders', value: '842', icon: ShoppingCart, delta: '+34' },
          { label: 'Avg Order Value', value: formatCurrency(124), icon: Package, delta: '+$8' },
          { label: 'Refund Rate', value: '2.1%', icon: RotateCcw, delta: '-0.4%' },
        ].map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}><CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary"><Icon className="h-4 w-4" /></div>
                <span className="text-[11px] text-muted-foreground">{s.delta}</span>
              </div>
              <p className="text-2xl font-bold tabular-nums">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent></Card>
          )
        })}
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders"><Receipt className="h-3.5 w-3.5 mr-1.5" />Invoices</TabsTrigger>
          <TabsTrigger value="coupons"><Tag className="h-3.5 w-3.5 mr-1.5" />Coupons</TabsTrigger>
          <TabsTrigger value="taxes"><Percent className="h-3.5 w-3.5 mr-1.5" />Taxes</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search invoices..." className="pl-9" />
            </div>
            <Button size="sm" onClick={() => toast.success('Export started', { description: 'Your invoices CSV will download shortly.' })}><Download className="h-4 w-4 mr-1.5" />Export</Button>
          </div>
          <Card><CardContent className="p-0">
            <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2.5 border-b text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <div className="col-span-3">Invoice</div><div className="col-span-3">Customer</div><div className="col-span-2">Amount</div><div className="col-span-2">Status</div><div className="col-span-2 text-right">Date</div>
            </div>
            {invoices.map((inv, i) => (
              <motion.div key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="grid grid-cols-12 gap-2 px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition items-center text-sm">
                <div className="col-span-12 sm:col-span-3 font-mono text-xs">{inv.id}</div>
                <div className="col-span-6 sm:col-span-3 truncate">{inv.customer}</div>
                <div className="col-span-3 sm:col-span-2 font-semibold tabular-nums">{formatCurrency(inv.amount)}</div>
                <div className="col-span-3 sm:col-span-2"><Badge variant="secondary" className={cn('text-[10px]', STATUS_CLS[inv.status])}>{inv.status}</Badge></div>
                <div className="col-span-12 sm:col-span-2 sm:text-right text-xs text-muted-foreground">{inv.date}</div>
              </motion.div>
            ))}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="coupons" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-end gap-2 mb-4">
                <div className="flex-1"><label className="text-xs font-medium">Coupon code</label><Input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="SUMMER30" className="mt-1 font-mono" /></div>
                <Button size="sm" onClick={() => { if (!coupon.trim()) { toast.error('Enter a coupon code first'); return } toast.success(`Coupon "${coupon}" created!`, { description: '20% discount · 1000 use limit · Active' }); setCoupon('') }}><Plus className="h-4 w-4 mr-1.5" />Create</Button>
              </div>
              <div className="space-y-2">
                {coupons.map((c) => (
                  <div key={c.code} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Tag className="h-4 w-4" /></div>
                    <div className="flex-1"><p className="text-sm font-mono font-semibold">{c.code}</p><p className="text-xs text-muted-foreground">{c.uses} / {c.limit} uses</p></div>
                    <div className="text-right"><p className="text-lg font-bold text-primary">{c.discount}</p><p className="text-[10px] text-muted-foreground">discount</p></div>
                    <Badge variant="secondary" className={cn('text-[10px]', STATUS_CLS[c.status])}>{c.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxes">
          <Card><CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary"><Percent className="h-5 w-5" /></div><div><p className="font-semibold">Tax configuration</p><p className="text-xs text-muted-foreground">Automatically collect tax based on customer location.</p></div></div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[{ r: 'US', v: 'Varies by state' }, { r: 'EU', v: 'VAT 19-25%' }, { r: 'UK', v: 'VAT 20%' }].map((t) => (
                <div key={t.r} className="rounded-lg border p-3"><p className="text-xs font-semibold">{t.r}</p><p className="text-xs text-muted-foreground mt-0.5">{t.v}</p></div>
              ))}
            </div>
            <Button size="sm" onClick={() => toast.info('Tax region settings opened', { description: 'Configure rates for US states, EU VAT, and more.' })}>Configure tax regions</Button>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
