'use client'
import { motion } from 'framer-motion'
import { DollarSign, Users, TrendingUp, Eye, Globe, Mail, Download } from 'lucide-react'
import { useApi, formatCurrency, formatNumber } from '@/hooks/use-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { MetricCard } from '@/components/ui-enterprise/MetricCard'
import { LoadingState } from '@/components/ui-enterprise/LoadingState'
import { SectionHeader } from '@/components/ui-enterprise/SectionHeader'
import { StatGrid } from '@/components/ui-enterprise/StatGrid'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts'

interface Data {
  stats: { revenue: number; mrr: number; arr: number; students: number; members: number; products: number; courses: number; customers: number; posts: number; pages: number; affiliates: number }
  charts: { months: { month: string; revenue: number; students: number }[]; traffic: { source: string; visitors: number; pct: number }[] }
  topPages: { id: string; title: string; slug: string; type: string; visits: number }[]
  emailPerf: { name: string; openRate: number; clickRate: number; recipients: number }[]
}

const PIE_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--muted-foreground)']

export function AnalyticsModule() {
  const { data, loading } = useApi<Data>('/api/data/analytics')

  if (loading || !data) return <LoadingState size="lg" text="Loading analytics..." />

  const kpis = [
    { label: 'Revenue (YTD)', value: formatCurrency(data.stats.revenue, { compact: true }), delta: '+12.4%', icon: DollarSign },
    { label: 'MRR', value: formatCurrency(data.stats.mrr, { compact: true }), delta: '+8.2%', icon: TrendingUp },
    { label: 'ARR', value: formatCurrency(data.stats.arr, { compact: true }), delta: '+8.2%', icon: TrendingUp },
    { label: 'Students', value: formatNumber(data.stats.students, true), delta: '+5.1%', icon: Users },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Deep-dive performance across revenue, audience, and engagement.</p>
        <Button variant="outline" size="sm" onClick={() => toast.success('Report exporting', { description: 'Your analytics report (PDF) will download shortly.' })}><Download className="h-4 w-4 mr-1.5" /> Export report</Button>
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

      {/* Revenue + Students trend */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Revenue Trend</CardTitle><p className="text-xs text-muted-foreground">Last 12 months</p></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.charts.months} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs><linearGradient id="r2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} formatter={(v: number) => formatCurrency(v)} />
                <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#r2)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Student Growth</CardTitle><p className="text-xs text-muted-foreground">New students per month</p></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.charts.months} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="students" fill="var(--chart-2)" radius={[6, 6, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Traffic sources */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-1.5"><Globe className="h-4 w-4" />Traffic Sources</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={data.charts.traffic} dataKey="visitors" nameKey="source" innerRadius={48} outerRadius={72} paddingAngle={3} stroke="none">
                  {data.charts.traffic.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatNumber(v)} contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {data.charts.traffic.map((t, i) => (
                <div key={t.source} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} /><span className="text-muted-foreground">{t.source}</span></div>
                  <div className="flex items-center gap-2"><span className="font-medium tabular-nums">{formatNumber(t.visitors, true)}</span><span className="text-muted-foreground text-[10px]">{t.pct}%</span></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top pages */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-1.5"><Eye className="h-4 w-4" />Top Pages</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.topPages.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{p.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">/{p.slug}</p>
                </div>
                <span className="text-xs font-semibold tabular-nums">{formatNumber(p.visits, true)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Email performance */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-1.5"><Mail className="h-4 w-4" />Email Performance</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.emailPerf} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v * 100}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={90} />
                <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} formatter={(v: number) => `${(v * 100).toFixed(0)}%`} />
                <Bar dataKey="openRate" fill="var(--chart-1)" radius={[0, 4, 4, 0]} barSize={10} />
                <Bar dataKey="clickRate" fill="var(--chart-3)" radius={[0, 4, 4, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-3 mt-2 text-[10px]">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: 'var(--chart-1)' }} />Open rate</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: 'var(--chart-3)' }} />Click rate</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audience overview */}
      <StatGrid
        columns={4}
        items={[
          { label: 'Community Members', value: formatNumber(10112, true), icon: Users, color: 'primary' },
          { label: 'Email Subscribers', value: formatNumber(12400, true), icon: Mail, color: 'success' },
          { label: 'Total Customers', value: formatNumber(data.stats.customers), icon: DollarSign, color: 'warning' },
          { label: 'Affiliate Partners', value: String(data.stats.affiliates), icon: TrendingUp, color: 'danger' },
        ]}
      />
    </div>
  )
}
