'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Star, Download, Package, ShoppingBag, Crown, Layers, Plus, DollarSign, TrendingUp, Sparkles } from 'lucide-react'
import { useApi, formatCurrency, formatNumber } from '@/hooks/use-api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'

interface Product { id: string; name: string; description: string; type: string; price: number; compareAt: number | null; salesCount: number; rating: number; status: string; revenue: number }

const TYPE_META: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; gradient: string }> = {
  DIGITAL: { icon: Download, color: 'text-emerald-600', gradient: 'from-emerald-500/20 to-teal-500/10' },
  BUNDLE: { icon: Layers, color: 'text-violet-600', gradient: 'from-violet-500/20 to-fuchsia-500/10' },
  MEMBERSHIP: { icon: Crown, color: 'text-amber-600', gradient: 'from-amber-500/20 to-orange-500/10' },
  COURSE: { icon: Package, color: 'text-sky-600', gradient: 'from-sky-500/20 to-cyan-500/10' },
}
const FILTERS = ['All', 'DIGITAL', 'BUNDLE', 'MEMBERSHIP', 'COURSE']

export function ProductsModule() {
  const { data: products, loading } = useApi<Product[]>('/api/data/products')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const setActiveModule = useAppStore((s) => s.setActiveModule)

  const filtered = (products || []).filter((p) =>
    (filter === 'All' || p.type === filter) &&
    p.name.toLowerCase().includes(query.toLowerCase())
  )
  const totalRevenue = (products || []).reduce((s, p) => s + p.revenue, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setActiveModule('ai-studio')}>
            <Sparkles className="h-4 w-4 mr-1.5 text-primary" /> AI Product Idea
          </Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> Add Product</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Products', value: String(products?.length || 0), icon: Package },
          { label: 'Total Sales', value: formatNumber(products?.reduce((s, p) => s + p.salesCount, 0) || 0), icon: ShoppingBag },
          { label: 'Revenue', value: formatCurrency(totalRevenue, { compact: true }), icon: DollarSign },
          { label: 'Avg Rating', value: `${((products?.reduce((s, p) => s + p.rating, 0) || 0) / (products?.length || 1)).toFixed(1)}★`, icon: Star },
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

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('rounded-full px-3 py-1.5 text-xs font-medium transition',
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70 text-muted-foreground')}>
            {f === 'All' ? 'All Products' : f.charAt(0) + f.slice(1).toLowerCase() + 's'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => {
            const meta = TYPE_META[p.type] || TYPE_META.DIGITAL
            const Icon = meta.icon
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="group cursor-pointer overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all">
                  <div className={cn('relative h-28 bg-gradient-to-br flex items-center justify-center', meta.gradient)}>
                    <Icon className={cn('h-10 w-10', meta.color)} />
                    <Badge className="absolute top-3 left-3" variant="secondary">{p.type}</Badge>
                    {p.compareAt && <Badge className="absolute top-3 right-3 bg-rose-500 text-white" variant="secondary">Sale</Badge>}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm leading-snug line-clamp-1 group-hover:text-primary transition">{p.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{p.rating}</span>
                      <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{formatNumber(p.salesCount, true)} sales</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t pt-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-primary">{formatCurrency(p.price)}</span>
                        {p.compareAt && <span className="text-xs text-muted-foreground line-through">{formatCurrency(p.compareAt)}</span>}
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 text-xs">Edit</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
