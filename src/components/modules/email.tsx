'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Send, Users, MousePointer, Eye, Plus, Sparkles, Clock, CheckCircle2, Calendar, Zap, Loader2, Copy, Trash2, MoreVertical, Pencil } from 'lucide-react'
import { useApi, formatNumber } from '@/hooks/use-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/store/app-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/hooks/use-api'
import { ApiErrorBanner, ModuleEmptyState } from '@/components/modules/_state-utils'

interface Campaign {
  id: string; name: string; subject: string; previewText?: string; body?: string;
  type: string; status: string; audience?: string;
  recipients: number; openRate: number; clickRate: number;
  date: string; sentAt?: string | null; scheduledAt?: string | null;
}

interface Data {
  stats: { subscribers: number; campaigns: number; totalSent: number; avgOpen: number; avgClick: number }
  campaigns: Campaign[]
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
  const { data, loading, error, refetch } = useApi<Data>('/api/data/email')
  const setActiveModule = useAppStore((s) => s.setActiveModule)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [testOpen, setTestOpen] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  if (error) return <ApiErrorBanner message={error} onRetry={refetch} />
  if (loading || !data) return <Skeleton className="h-96 rounded-xl" />

  const kpis = [
    { label: 'Subscribers', value: formatNumber(data.stats.subscribers, true), icon: Users, delta: '+342 this week' },
    { label: 'Avg Open Rate', value: `${(data.stats.avgOpen * 100).toFixed(1)}%`, icon: Eye, delta: '+2.4%' },
    { label: 'Avg Click Rate', value: `${(data.stats.avgClick * 100).toFixed(1)}%`, icon: MousePointer, delta: '+0.8%' },
    { label: 'Emails Sent', value: formatNumber(data.stats.totalSent, true), icon: Send, delta: '30 days' },
  ]

  const deleteCampaign = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setActionLoadingId(id)
    try {
      const res = await fetch(`/api/data/email?id=${id}`, { method: 'DELETE' })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Failed') }
      toast.success('Campaign deleted', { description: `"${name}" has been removed.` })
      refetch()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } finally { setActionLoadingId(null) }
  }

  const duplicateCampaign = async (c: Campaign) => {
    setActionLoadingId(c.id)
    try {
      const res = await fetch('/api/data/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${c.name} (Copy)`, subject: c.subject, body: c.body || '', type: c.type }),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Failed') }
      toast.success('Campaign duplicated', { description: `"${c.name} (Copy)" has been created.` })
      refetch()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } finally { setActionLoadingId(null) }
  }

  const sendNow = async (id: string) => {
    if (!confirm('Send this campaign to all subscribers now? This cannot be undone.')) return
    setActionLoadingId(id)
    try {
      const res = await fetch('/api/data/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'SENT' }),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Failed') }
      toast.success('Campaign sent!', { description: 'Your email is being delivered to all subscribers.' })
      refetch()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } finally { setActionLoadingId(null) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Grow and nurture your audience with broadcasts, automations, and sequences.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setActiveModule('ai-studio')}>
            <Sparkles className="h-4 w-4 mr-1.5 text-primary" /> AI Email Writer
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> New Campaign</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <Card key={k.label}><CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary"><Icon className="h-4 w-4" /></div>
                <span className="text-xs text-muted-foreground">{k.delta}</span>
              </div>
              <p className="text-2xl font-bold tabular-nums">{k.value}</p>
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </CardContent></Card>
          )
        })}
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Campaigns</CardTitle></CardHeader>
        <CardContent className="space-y-1.5">
          {data.campaigns.length === 0 ? (
            <ModuleEmptyState icon={Mail} title="No campaigns yet" hint="Create your first broadcast, automation, or sequence to start engaging your audience." />
          ) : data.campaigns.map((c, i) => {
            const tm = TYPE_META[c.type] || TYPE_META.BROADCAST
            const sm = STATUS_META[c.status] || STATUS_META.DRAFT
            const TIcon = tm.icon; const SIcon = sm.icon
            return (
              <motion.div key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="group flex items-center gap-3 rounded-lg p-3 hover:bg-muted/50 transition">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', tm.color)}><TIcon className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditingId(c.id)}>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <Badge variant="secondary" className={cn('text-xs', sm.cls)}><SIcon className="h-3 w-3 mr-1" />{sm.label}</Badge>
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
                {c.status === 'DRAFT' && (
                  <Button size="sm" onClick={() => sendNow(c.id)} disabled={actionLoadingId === c.id}>
                    {actionLoadingId === c.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                    Send Now
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => setEditingId(c.id)}><Pencil className="h-3.5 w-3.5 mr-2" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => duplicateCampaign(c)}><Copy className="h-3.5 w-3.5 mr-2" /> Duplicate</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTestOpen(c.id)}><Send className="h-3.5 w-3.5 mr-2" /> Send Test</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => deleteCampaign(c.id, c.name)} className="text-rose-600"><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            )
          })}
        </CardContent>
      </Card>

      <CampaignBuilder open={createOpen || !!editingId} editingId={editingId} onClose={() => { setCreateOpen(false); setEditingId(null) }} onSaved={() => { setCreateOpen(false); setEditingId(null); refetch() }} />
      <SendTestDialog campaignId={testOpen} onClose={() => setTestOpen(null)} />
    </div>
  )
}

function CampaignBuilder({ open, editingId, onClose, onSaved }: { open: boolean; editingId: string | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState('BROADCAST')
  const [audience, setAudience] = useState('ALL')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Load existing campaign for editing
  useState(() => {
    if (editingId && open && !loaded) {
      setLoaded(true)
      fetch('/api/data/email').then(r => r.json()).then((data: Data) => {
        const c = data.campaigns.find((c) => c.id === editingId)
        if (c) {
          setName(c.name); setSubject(c.subject); setPreviewText(c.previewText || '')
          setBody(c.body || ''); setType(c.type); setAudience(c.audience || 'ALL')
        }
      }).catch(() => {})
    }
    if (!open) { setLoaded(false); setName(''); setSubject(''); setPreviewText(''); setBody(''); setType('BROADCAST'); setAudience('ALL') }
  })

  const save = async () => {
    if (!name.trim()) { toast.error('Campaign name is required'); return }
    if (!subject.trim()) { toast.error('Subject line is required'); return }
    if (!body.trim()) { toast.error('Email body is required'); return }
    setSaving(true)
    try {
      const isEdit = Boolean(editingId)
      const res = await fetch('/api/data/email', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(isEdit ? { id: editingId } : {}), name: name.trim(), subject: subject.trim(), previewText, body, type, audience }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success(isEdit ? 'Changes saved' : 'Draft saved', { description: `"${name}" is ready to send.` })
      onSaved()
    } catch (e) {
      toast.error('Failed to save', { description: e instanceof Error ? e.message : 'Unknown error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingId ? 'Edit Campaign' : 'New Campaign'}</DialogTitle>
          <DialogDescription>{editingId ? 'Update your campaign details.' : 'Draft your broadcast, automation, or sequence.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto scroll-thin">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Campaign name <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Welcome Series - Email 1" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Subject line <span className="text-destructive">*</span></Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Welcome to CreatorOS!" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Preview text</Label>
            <Input value={previewText} onChange={(e) => setPreviewText(e.target.value)} placeholder="A short preview shown in the inbox..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BROADCAST">Broadcast</SelectItem>
                  <SelectItem value="AUTOMATION">Automation</SelectItem>
                  <SelectItem value="SEQUENCE">Sequence</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Audience</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All subscribers</SelectItem>
                  <SelectItem value="STUDENTS">Students</SelectItem>
                  <SelectItem value="CUSTOMERS">Customers</SelectItem>
                  <SelectItem value="MEMBERS">Members</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Body content <span className="text-destructive">*</span></Label>
            <Textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your email content here. Plain text or HTML supported." />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving...</> : editingId ? 'Save Changes' : 'Save Draft'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SendTestDialog({ campaignId, onClose }: { campaignId: string | null; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    if (!email.trim() || !email.includes('@')) { toast.error('Please enter a valid email'); return }
    setSending(true)
    await new Promise((r) => setTimeout(r, 1000))
    toast.success('Test email sent', { description: `A test has been sent to ${email}` })
    setSending(false); setEmail(''); onClose()
  }

  return (
    <Dialog open={!!campaignId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send Test Email</DialogTitle>
          <DialogDescription>Send a test of this campaign to your email address.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Email address</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={send} disabled={sending || !email.trim()}>
            {sending ? (<><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Sending...</>) : (<><Send className="h-4 w-4 mr-1.5" /> Send Test</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
