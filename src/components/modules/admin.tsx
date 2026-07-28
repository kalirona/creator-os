'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck, Zap, Cpu, ToggleLeft, Settings2, History, Users, DollarSign,
  Database, Sliders, Save, Loader2, Eye, EyeOff, Check, AlertCircle, Server, Layers, Activity,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useApi, formatNumber } from '@/hooks/use-api'
import { cn } from '@/lib/utils'

interface Tool {
  id: string; slug: string; name: string; description: string; icon: string; category: string;
  systemPrompt: string; creditCost: number; temperature: number; maxTokens: number;
  outputType: string; isVisible: boolean; isPro: boolean;
}
interface ToolStats { total: number; visible: number; pro: number; generations: number; totalCreditsUsed: number }

export function AdminModule() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card">
        <CardContent className="p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/30">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Super Admin</h2>
                <Badge variant="secondary" className="bg-amber-500/15 text-amber-600 border-amber-500/20">Platform Control Center</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Manage AI providers, tools, routing, feature flags, billing, and global settings — no code required.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tools">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="tools"><Sliders className="h-3.5 w-3.5 mr-1.5" />Tool Builder</TabsTrigger>
          <TabsTrigger value="providers"><Server className="h-3.5 w-3.5 mr-1.5" />AI Providers</TabsTrigger>
          <TabsTrigger value="routing"><Cpu className="h-3.5 w-3.5 mr-1.5" />Model Routing</TabsTrigger>
          <TabsTrigger value="flags"><ToggleLeft className="h-3.5 w-3.5 mr-1.5" />Feature Flags</TabsTrigger>
          <TabsTrigger value="generations"><History className="h-3.5 w-3.5 mr-1.5" />Generations</TabsTrigger>
          <TabsTrigger value="settings"><Settings2 className="h-3.5 w-3.5 mr-1.5" />Global Settings</TabsTrigger>
          <TabsTrigger value="platform"><Activity className="h-3.5 w-3.5 mr-1.5" />Platform</TabsTrigger>
        </TabsList>

        <TabsContent value="tools"><ToolBuilder /></TabsContent>
        <TabsContent value="providers"><ProvidersPanel /></TabsContent>
        <TabsContent value="routing"><RoutingPanel /></TabsContent>
        <TabsContent value="flags"><FlagsPanel /></TabsContent>
        <TabsContent value="generations"><GenerationsPanel /></TabsContent>
        <TabsContent value="settings"><SettingsPanel /></TabsContent>
        <TabsContent value="platform"><PlatformPanel /></TabsContent>
      </Tabs>
    </div>
  )
}

// ===== Tool Builder — edit prompts, costs, temp, visibility (no code) =====
function ToolBuilder() {
  const { data, loading, refetch } = useApi<{ tools: Tool[]; stats: ToolStats }>('/api/admin/tools')
  const [editing, setEditing] = useState<Tool | null>(null)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/tools', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(`"${editing.name}" updated`)
      setEditing(null); refetch()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') }
    finally { setSaving(false) }
  }

  if (loading || !data) return <Skeleton className="h-96 rounded-xl" />

  const stats = data.stats
  const grouped = data.tools.reduce<Record<string, Tool[]>>((acc, t) => { (acc[t.category] ||= []).push(t); return acc }, {})

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { l: 'Total Tools', v: stats.total, i: Sliders },
          { l: 'Visible', v: stats.visible, i: Eye },
          { l: 'Generations', v: formatNumber(stats.generations), i: Activity },
          { l: 'Credits Used', v: formatNumber(stats.totalCreditsUsed), i: Zap },
        ].map((s) => { const Icon = s.i; return (
          <Card key={s.l}><CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600"><Icon className="h-4 w-4" /></div>
            <div><p className="text-lg font-bold tabular-nums leading-none">{s.v}</p><p className="text-[11px] text-muted-foreground mt-1">{s.l}</p></div>
          </CardContent></Card>
        )})}
      </div>

      {editing ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Sliders className="h-4 w-4 text-amber-500" /> Editing: {editing.name}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
              <Button size="sm" onClick={save} disabled={saving}>{saving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Saving</> : <><Save className="h-4 w-4 mr-1.5" />Save</>}</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Tool Name</Label><Input className="mt-1.5" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Category</Label><Input className="mt-1.5" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></div>
            </div>
            <div><Label>Description</Label><Input className="mt-1.5" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
            <div><Label>System Prompt <span className="text-xs text-muted-foreground">(controls AI behavior)</span></Label><Textarea className="mt-1.5 font-mono text-xs" rows={8} value={editing.systemPrompt} onChange={(e) => setEditing({ ...editing, systemPrompt: e.target.value })} /></div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div><Label>Credit Cost</Label><Input type="number" className="mt-1.5" value={editing.creditCost} onChange={(e) => setEditing({ ...editing, creditCost: Number(e.target.value) })} /></div>
              <div><Label>Temperature</Label><Input type="number" step="0.1" min="0" max="2" className="mt-1.5" value={editing.temperature} onChange={(e) => setEditing({ ...editing, temperature: Number(e.target.value) })} /></div>
              <div><Label>Max Tokens</Label><Input type="number" className="mt-1.5" value={editing.maxTokens} onChange={(e) => setEditing({ ...editing, maxTokens: Number(e.target.value) })} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Output Type</Label>
                <Select value={editing.outputType} onValueChange={(v) => setEditing({ ...editing, outputType: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{['MARKDOWN', 'COURSE', 'LESSON', 'EMAIL', 'SALES_PAGE', 'BLOG', 'SOCIAL', 'SCRIPT', 'PRODUCT', 'LANDING'].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-4 pb-1">
                <div className="flex items-center gap-2"><Switch checked={editing.isVisible} onCheckedChange={(v) => setEditing({ ...editing, isVisible: v })} /><Label className="text-xs">Visible</Label></div>
                <div className="flex items-center gap-2"><Switch checked={editing.isPro} onCheckedChange={(v) => setEditing({ ...editing, isPro: v })} /><Label className="text-xs">PRO only</Label></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([cat, tools]) => (
          <div key={cat}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{cat}</p>
            <div className="space-y-2">
              {tools.map((t) => (
                <Card key={t.id}><CardContent className="p-3 flex items-center gap-3">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', t.isVisible ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground')}>
                    <Layers className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><p className="text-sm font-medium">{t.name}</p><code className="text-[10px] text-muted-foreground">{t.slug}</code></div>
                    <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{t.creditCost}cr</span><span>temp {t.temperature}</span><span>{t.maxTokens}tok</span>
                  </div>
                  <Badge variant="secondary" className={cn('text-[10px]', t.outputType === 'MARKDOWN' ? '' : 'bg-primary/10 text-primary')}>{t.outputType}</Badge>
                  {t.isPro && <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600">PRO</Badge>}
                  <Badge variant="secondary" className={cn('text-[10px]', t.isVisible ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted')}>{t.isVisible ? 'Visible' : 'Hidden'}</Badge>
                  <Button size="sm" variant="outline" onClick={() => setEditing(t)}>Edit</Button>
                </CardContent></Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ===== AI Providers =====
function ProvidersPanel() {
  const { data, loading, refetch } = useApi<{ providers: ({id: string; name: string; slug: string; apiKey: string; baseUrl: string; isActive: boolean; priority: number; models: {id: string; name: string; displayName: string; isDefault: boolean; isActive: boolean; costMultiplier: number}[]})[] }>('/api/admin/providers')
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})

  if (loading || !data) return <Skeleton className="h-96 rounded-xl" />

  return (
    <div className="space-y-4">
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
          <p className="text-xs text-muted-foreground">API keys are encrypted at rest and never exposed to the client. Smart routing automatically selects the highest-priority active provider.</p>
        </CardContent>
      </Card>
      {data.providers.map((p) => (
        <Card key={p.id}>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-3">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', p.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground')}><Server className="h-5 w-5" /></div>
              <div><p className="font-semibold text-sm">{p.name}</p><p className="text-xs text-muted-foreground">Priority {p.priority} · {p.models.length} models</p></div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={cn('text-[10px]', p.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted')}>{p.isActive ? 'Active' : 'Disabled'}</Badge>
              <Switch checked={p.isActive} onCheckedChange={async (v) => { await fetch('/api/admin/providers', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, isActive: v }) }); toast.success(`${p.name} ${v ? 'enabled' : 'disabled'}`); refetch() }} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label className="text-xs">API Key</Label>
                <div className="flex gap-2 mt-1">
                  <Input type={showKey[p.id] ? 'text' : 'password'} value={p.apiKey || '(not set)'} readOnly className="font-mono text-xs" />
                  <Button size="icon" variant="outline" onClick={() => setShowKey((s) => ({ ...s, [p.id]: !s[p.id] }))}>{showKey[p.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</Button>
                </div>
              </div>
              <div><Label className="text-xs">Base URL</Label><Input value={p.baseUrl || '(default)'} readOnly className="mt-1 text-xs font-mono" /></div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1.5">Models</p>
              <div className="space-y-1.5">
                {p.models.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                    <Cpu className={cn('h-4 w-4', m.isActive ? 'text-emerald-500' : 'text-muted-foreground')} />
                    <div className="flex-1"><p className="text-xs font-medium">{m.displayName}</p><p className="text-[10px] text-muted-foreground">{m.name} · {m.costMultiplier}x cost</p></div>
                    {m.isDefault && <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">Default</Badge>}
                    <Badge variant="secondary" className={cn('text-[10px]', m.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted')}>{m.isActive ? 'Active' : 'Off'}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ===== Model Routing =====
function RoutingPanel() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Cpu className="h-4 w-4 text-amber-500" />Smart Routing Strategy</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { id: 'smart', name: 'Smart AI (Recommended)', desc: 'Auto-selects the best model per task based on output type, cost, and latency', active: true },
            { id: 'cost', name: 'Cost Optimized', desc: 'Always picks the cheapest active model that can handle the task', active: false },
            { id: 'quality', name: 'Quality First', desc: 'Always picks the highest-capability model, regardless of cost', active: false },
            { id: 'round', name: 'Round Robin', desc: 'Distributes requests evenly across all active providers', active: false },
          ].map((s) => (
            <div key={s.id} className={cn('flex items-start gap-3 rounded-lg border p-3 cursor-pointer', s.active && 'border-primary bg-primary/5')}>
              <div className={cn('flex h-5 w-5 mt-0.5 items-center justify-center rounded-full border-2', s.active ? 'border-primary bg-primary' : 'border-muted-foreground')}>
                {s.active && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
              <div className="flex-1"><p className="text-sm font-medium">{s.name}</p><p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p></div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600"><Check className="h-5 w-5" /></div>
          <div><p className="text-sm font-medium">Fallback enabled</p><p className="text-xs text-muted-foreground">If the primary provider fails, requests automatically retry on the next active provider.</p></div>
          <Switch defaultChecked />
        </CardContent>
      </Card>
    </div>
  )
}

// ===== Feature Flags =====
function FlagsPanel() {
  const { data, loading, refetch } = useApi<{ flags: {id: string; key: string; name: string; description: string; enabled: boolean}[] }>('/api/admin/flags')
  if (loading || !data) return <Skeleton className="h-96 rounded-xl" />
  return (
    <div className="space-y-2">
      {data.flags.map((f) => (
        <Card key={f.id}><CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', f.enabled ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground')}><ToggleLeft className="h-5 w-5" /></div>
            <div><div className="flex items-center gap-2"><p className="text-sm font-medium">{f.name}</p><code className="text-[10px] text-muted-foreground">{f.key}</code></div><p className="text-xs text-muted-foreground">{f.description}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={cn('text-[10px]', f.enabled ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted')}>{f.enabled ? 'Enabled' : 'Disabled'}</Badge>
            <Switch checked={f.enabled} onCheckedChange={async (v) => { await fetch('/api/admin/flags', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: f.id, enabled: v }) }); toast.success(`${f.name} ${v ? 'enabled' : 'disabled'}`); refetch() }} />
          </div>
        </CardContent></Card>
      ))}
    </div>
  )
}

// ===== Generations log =====
function GenerationsPanel() {
  const { data, loading } = useApi<{ generations: {id: string; toolSlug: string; title: string; status: string; creditsUsed: number; createdAt: string}[] }>('/api/admin/generations')
  if (loading || !data) return <Skeleton className="h-96 rounded-xl" />
  return (
    <Card><CardContent className="p-0">
      <div className="max-h-[600px] overflow-y-auto scroll-thin">
        {data.generations.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No generations yet. Generate something in AI Studio!</div>
        ) : data.generations.map((g, i) => (
          <motion.div key={g.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
            className="flex items-center gap-3 p-3 border-b last:border-0 hover:bg-muted/50">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600"><History className="h-4 w-4" /></div>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{g.title}</p><p className="text-xs text-muted-foreground">{g.toolSlug} · {new Date(g.createdAt).toLocaleString()}</p></div>
            <Badge variant="secondary" className={cn('text-[10px]', g.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600')}>{g.status}</Badge>
            <span className="text-xs font-semibold text-amber-600 tabular-nums">-{g.creditsUsed}cr</span>
          </motion.div>
        ))}
      </div>
    </CardContent></Card>
  )
}

// ===== Global Settings =====
function SettingsPanel() {
  const { data, loading, refetch } = useApi<{ settings: {id: string; key: string; value: string; category: string}[] }>('/api/admin/settings')
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [savingKey, setSavingKey] = useState<string | null>(null)

  if (loading || !data) return <Skeleton className="h-96 rounded-xl" />

  const grouped = data.settings.reduce<Record<string, typeof data.settings>>((acc, s) => { (acc[s.category] ||= []).push(s); return acc }, {})
  const CAT_ICON: Record<string, React.ComponentType<{ className?: string }>> = { general: Settings2, billing: DollarSign, ai: Cpu, storage: Database, email: Server }

  const save = async (id: string, key: string) => {
    setSavingKey(key)
    try {
      await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, value: editing[key] }) })
      toast.success(`${key} updated`); setEditing((e) => { const n = { ...e }; delete n[key]; return n }); refetch()
    } catch { toast.error('Failed') } finally { setSavingKey(null) }
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([cat, settings]) => {
        const Icon = CAT_ICON[cat] || Settings2
        return (
          <Card key={cat}>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Icon className="h-4 w-4 text-amber-500" />{cat.charAt(0).toUpperCase() + cat.slice(1)}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {settings.map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <code className="text-xs text-muted-foreground w-44 shrink-0 truncate">{s.key}</code>
                  <Input value={editing[s.key] ?? s.value} onChange={(e) => setEditing((ed) => ({ ...ed, [s.key]: e.target.value }))} className="text-xs h-8" />
                  {editing[s.key] !== undefined && editing[s.key] !== s.value && (
                    <Button size="sm" className="h-8" onClick={() => save(s.id, s.key)} disabled={savingKey === s.key}>
                      {savingKey === s.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ===== Platform overview =====
function PlatformPanel() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { l: 'Total Users', v: '10,112', i: Users, c: 'text-emerald-500' },
          { l: 'Workspaces', v: '1,240', i: Layers, c: 'text-primary' },
          { l: 'MRR', v: '$24.8K', i: DollarSign, c: 'text-amber-500' },
          { l: 'Storage Used', v: '142 GB', i: Database, c: 'text-sky-500' },
        ].map((s) => { const Icon = s.i; return (
          <Card key={s.l}><CardContent className="p-4 flex items-center gap-3">
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg bg-muted', s.c)}><Icon className="h-4 w-4" /></div>
            <div><p className="text-lg font-bold tabular-nums leading-none">{s.v}</p><p className="text-[11px] text-muted-foreground mt-1">{s.l}</p></div>
          </CardContent></Card>
        )})}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-amber-500" />System Health</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[
            { s: 'API Gateway', st: 'Operational', up: 99.98 },
            { s: 'AI Provider (Z.ai)', st: 'Operational', up: 99.95 },
            { s: 'Database', st: 'Operational', up: 100 },
            { s: 'File Storage', st: 'Operational', up: 99.99 },
            { s: 'Email Delivery', st: 'Degraded', up: 97.2 },
          ].map((x) => (
            <div key={x.s} className="flex items-center justify-between rounded-lg border p-2.5">
              <div className="flex items-center gap-2"><span className={cn('h-2 w-2 rounded-full', x.st === 'Operational' ? 'bg-emerald-500' : 'bg-amber-500')} /><span className="text-sm">{x.s}</span></div>
              <div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">{x.up}% uptime</span><Badge variant="secondary" className={cn('text-[10px]', x.st === 'Operational' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600')}>{x.st}</Badge></div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
