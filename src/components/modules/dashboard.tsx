'use client'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  DollarSign,
  Users,
  GraduationCap,
  Star,
  ShoppingCart,
  Sparkles,
  ArrowUpRight,
  Activity,
  Zap,
  Package,
} from 'lucide-react'
import { useApi, formatCurrency, formatNumber, timeAgo } from '@/hooks/use-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { useAppStore } from '@/store/app-store'
import { MetricCard } from '@/components/ui-enterprise/MetricCard'
import { AppCard } from '@/components/ui-enterprise/AppCard'
import { ActivityTimeline } from '@/components/ui-enterprise/ActivityTimeline'
import { StatGrid } from '@/components/ui-enterprise/StatGrid'
import { LoadingState } from '@/components/ui-enterprise/LoadingState'
import { ErrorState } from '@/components/ui-enterprise/ErrorState'

interface DashData {
  workspace: { name: string; plan: string; slug: string }
  stats: {
    revenue: number; refunded: number; mrr: number; totalStudents: number; activeMembers: number;
    courses: number; products: number; customers: number; avgRating: number; posts: number;
    affiliates: number; pages: number;
  }
  charts: {
    revenue14d: { date: string; revenue: number; orders: number }[]
    salesByType: { type: string; amount: number }[]
    topProducts: { name: string; sales: number; revenue: number }[]
  }
  recentOrders: { id: string; customer: string; email: string; amount: number; status: string; product: string; time: string }[]
  team: { name: string; email: string; role: string }[]
}

const PIE_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

export function DashboardModule() {
  const { data, loading, error, refetch } = useApi<DashData>('/api/data/dashboard')
  const setActiveModule = useAppStore((s) => s.setActiveModule)

  if (loading) return <LoadingState size="lg" text="Loading dashboard..." />
  if (error || !data) return <ErrorState description={error || 'Failed to load dashboard.'} action={{ label: 'Retry', onClick: refetch }} />

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 md:p-8"
      >
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-32 top-20 h-32 w-32 rounded-full bg-chart-2/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/20">
                <Sparkles className="h-3 w-3 mr-1" /> {data.workspace.plan} Plan
              </Badge>
              <span className="text-xs text-muted-foreground">Workspace: {data.workspace.name}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome back, Alex 👋</h2>
            <p className="text-sm text-muted-foreground max-w-lg">
              Your creator business is up <span className="font-semibold text-emerald-500">12.4%</span> this week.
              You have 3 new sales and 2 AI generations waiting.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setActiveModule('analytics')}>
              <Activity className="h-4 w-4 mr-1.5" /> View analytics
            </Button>
            <Button size="sm" onClick={() => setActiveModule('ai-studio')}>
              <Zap className="h-4 w-4 mr-1.5" /> Open AI Studio
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(data.stats.revenue)}
          change="+12.4%"
          changeType="increase"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <MetricCard
          title="MRR"
          value={formatCurrency(data.stats.mrr)}
          change="+8.2%"
          changeType="increase"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          title="Active Members"
          value={formatNumber(data.stats.activeMembers, true)}
          change="+5.1%"
          changeType="increase"
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          title="Avg Rating"
          value={`${data.stats.avgRating}★`}
          change="+0.2"
          changeType="increase"
          icon={<Star className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Revenue</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Last 14 days</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold tabular-nums">{formatCurrency(data.stats.revenue)}</p>
              <p className="text-xs text-emerald-500 font-medium">+12.4% vs prev period</p>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.charts.revenue14d} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} interval={1} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12, color: 'var(--popover-foreground)' }}
                  formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue Mix</CardTitle>
            <p className="text-xs text-muted-foreground">By product type</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={data.charts.salesByType} dataKey="amount" nameKey="type" innerRadius={48} outerRadius={72} paddingAngle={3} stroke="none">
                  {data.charts.salesByType.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {data.charts.salesByType.map((t, i) => (
                <div key={t.type} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-muted-foreground">{t.type}</span>
                  </div>
                  <span className="font-medium tabular-nums">{formatCurrency(t.amount, { compact: true })}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Top Products</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setActiveModule('products')}>
              View all <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.charts.topProducts} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v, true)} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={120} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), 'Revenue']} contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="revenue" fill="var(--chart-1)" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Recent Sales</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setActiveModule('crm')}>
              CRM <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1 max-h-[220px] overflow-y-auto scroll-thin">
            {data.recentOrders.map((o) => (
              <div key={o.id} className="flex items-center gap-3 py-1.5">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-[10px] bg-muted">
                    {o.customer.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{o.customer}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{o.product}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold tabular-nums">{formatCurrency(o.amount)}</p>
                  <p className="text-[10px] text-muted-foreground">{timeAgo(o.time)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <StatGrid
        items={[
          { label: 'Total Students', value: formatNumber(data.stats.totalStudents, true), icon: Users, color: 'primary' },
          { label: 'Courses', value: data.stats.courses, icon: GraduationCap, color: 'success' },
          { label: 'Products', value: data.stats.products, icon: Package, color: 'warning' },
          { label: 'Customers', value: formatNumber(data.stats.customers, true), icon: Users, color: 'primary' },
        ]}
        columns={4}
      />

      <AppCard variant="elevated" padding="md">
        <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
        <ActivityTimeline
        items={[
          { id: 1, title: 'New order from Marcus Lee', description: 'Premium course purchase', time: '2 min ago', status: 'success', icon: ShoppingCart },
          { id: 2, title: 'Community post published', description: "New discussion: 'Tips for course creators'", time: '12 min ago', status: 'primary', icon: Users },
          { id: 3, title: 'Course published', description: '"Advanced AI" is now live', time: '1 hour ago', status: 'success', icon: GraduationCap },
          { id: 4, title: 'AI content generated', description: '5 sections generated for landing page', time: '3 hours ago', status: 'muted', icon: Sparkles },
        ]}
         className="text-sm"
      />
      </AppCard>
    </div>
  )
}
