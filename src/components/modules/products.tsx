'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Star, Package, Plus, DollarSign, TrendingUp, Download, Eye, Copy,
  Trash2, MoreVertical, Pencil, Archive, BarChart3, Loader2, FileText, Image as ImageIcon,
  Layers, Tag, ArrowLeft, Save, Rocket, Settings, Globe,
} from 'lucide-react'
import { useApi, formatCurrency, formatNumber } from '@/hooks/use-api'
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
import { CreateDialog } from '@/components/app/create-dialog'
import { useAppStore } from '@/store/app-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ApiErrorBanner, ModuleEmptyState } from '@/components/modules/_state-utils'

interface Product {
  id: string; name: string; description: string; type: string; price: number
  compareAt: number | null; salesCount: number; rating: number; status: string
  coverUrl: string | null; fileUrl: string | null; revenue: number; createdAt: string
}

const TYPE_META: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; gradient: string; label: string }> = {
  DIGITAL: { icon: FileText, color: 'text-sky-600', gradient: 'from-sky-500/20 to-cyan-500/10', label: 'Digital' },
  BUNDLE: { icon: Layers, color: 'text-violet-600', gradient: 'from-violet-500/20 to-fuchsia-500/10', label: 'Bundle' },
  MEMBERSHIP: { icon: Package, color: 'text-amber-600', gradient: 'from-amber-500/20 to-orange-500/10', label: 'Membership' },
  COURSE: { icon: Package, color: 'text-emerald-600', gradient: 'from-emerald-500/20 to-teal-500/10', label: 'Course' },
}
const STATUS_META: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'Active', cls: 'bg-emerald-500/10 text-emerald-600' },
  DRAFT: { label: 'Draft', cls: 'bg-amber-500/10 text-amber-600' },
  ARCHIVED: { label: 'Archived', cls: 'bg-muted text-muted-foreground' },
}
const FILTERS = ['All', 'DIGITAL', 'BUNDLE', 'MEMBERSHIP', 'COURSE']

export function ProductsModule() {
  const { data: products, loading, error, refetch } = useApi<Product[]>('/api/data/products')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const setActiveModule = useAppStore((s) => s.setActiveModule)
  const createDialogFor = useAppStore((s) => s.createDialogFor)
  const clearCreateDialog = useAppStore((s) => s.clearCreateDialog)

  useEffect(() => {
    if (createDialogFor === 'products') {
      const t = setTimeout(() => { setCreateOpen(true); clearCreateDialog() }, 0)
      return () => clearTimeout(t)
    }
  }, [createDialogFor, clearCreateDialog])

  if (editingProduct) {
    return <ProductEditor product={editingProduct} onBack={() => { setEditingProduct(null); refetch() }} />
  }

  if (error) return <ApiErrorBanner message={error} onRetry={refetch} />

  const filtered = (products || []).filter((p) =>
    (filter === 'All' || p.type === filter) &&
    p.name.toLowerCase().includes(query.toLowerCase())
  )

  const totalRevenue = (products || []).reduce((s, p) => s + p.revenue, 0)
  const totalSales = (products || []).reduce((s, p) => s + p.salesCount, 0)

  const deleteProduct = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    setActionLoading(product.id)
    try {
      const res = await fetch(`/api/data/products?id=${product.id}`, { method: 'DELETE' })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Failed') }
      toast.success('Product deleted', { description: `"${product.name}" has been removed.` })
      refetch()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } finally { setActionLoading(null) }
  }

  const duplicateProduct = async (product: Product) => {
    setActionLoading(product.id)
    try {
      const res = await fetch('/api/data/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${product.name} (Copy)`, description: product.description, type: product.type, price: product.price, status: 'DRAFT' }),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Failed') }
      toast.success('Product duplicated', { description: `"${product.name} (Copy)" has been created.` })
      refetch()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } finally { setActionLoading(null) }
  }

  const toggleArchive = async (product: Product) => {
    const newStatus = product.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED'
    setActionLoading(product.id)
    try {
      const res = await fetch('/api/data/products', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, status: newStatus }),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Failed') }
      toast.success(newStatus === 'ARCHIVED' ? 'Product archived' : 'Product restored')
      refetch()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } finally { setActionLoading(null) }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." className="pl-9" />
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> New Product</Button>
      </div>

      {/* Stats */}
      {!loading && products && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Products', value: products.length, icon: Package },
            { label: 'Total Sales', value: formatNumber(totalSales, true), icon: TrendingUp },
            { label: 'Revenue', value: formatCurrency(totalRevenue, { compact: true }), icon: DollarSign },
            { label: 'Avg Rating', value: `${products.length ? (products.reduce((s, p) => s + p.rating, 0) / products.length).toFixed(1) : 0}★`, icon: Star },
          ].map((s) => {
            const Icon = s.icon
            return (
              <Card key={s.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary"><Icon className="h-4 w-4" /></div>
                  <div>
                    <p className="text-lg font-bold tabular-nums leading-none">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('rounded-full px-3 py-1.5 text-sm font-medium transition',
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70')}>
            {f === 'All' ? 'All Products' : TYPE_META[f]?.label || f}
          </button>
        ))}
      </div>

      {/* Product list */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <ModuleEmptyState
          icon={Package}
          title={query ? 'No products match your search' : 'No products yet'}
          hint={query ? 'Try a different search term.' : 'Create your first digital product to start selling.'}
          action={!query && <Button size="sm" className="mt-4" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> New Product</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => {
            const tm = TYPE_META[p.type] || TYPE_META.DIGITAL
            const sm = STATUS_META[p.status] || STATUS_META.DRAFT
            const TIcon = tm.icon
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="group overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all flex flex-col h-full">
                  <div className={cn('relative h-32 bg-gradient-to-br cursor-pointer', tm.gradient)} onClick={() => p.status !== 'ARCHIVED' && setEditingProduct(p)}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <TIcon className="h-12 w-12 text-foreground/30" />
                    </div>
                    <Badge className="absolute top-3 left-3" variant="secondary">{tm.label}</Badge>
                    <Badge className={cn('absolute top-3 right-3 text-xs', sm.cls)} variant="secondary">{sm.label}</Badge>
                  </div>
                  <CardContent className="p-4 flex flex-col flex-1">
                    <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition cursor-pointer" onClick={() => p.status !== 'ARCHIVED' && setEditingProduct(p)}>{p.name}</h3>
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 flex-1">{p.description}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{p.rating}</span>
                      <span className="flex items-center gap-1"><Download className="h-3 w-3" />{formatNumber(p.salesCount, true)}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t pt-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-primary">{p.price === 0 ? 'Free' : formatCurrency(p.price)}</span>
                        {p.compareAt && <span className="text-xs text-muted-foreground line-through">{formatCurrency(p.compareAt)}</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-8 text-xs gap-1" onClick={() => setEditingProduct(p)}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" disabled={actionLoading === p.id}>
                              {actionLoading === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MoreVertical className="h-3.5 w-3.5" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => setEditingProduct(p)}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { toast.info('Opening preview'); setActiveModule('store') }}><Eye className="h-4 w-4 mr-2" /> Preview</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { toast.info('Viewing sales'); setActiveModule('store') }}><BarChart3 className="h-4 w-4 mr-2" /> View Sales</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateProduct(p)}><Copy className="h-4 w-4 mr-2" /> Duplicate</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toggleArchive(p)}><Archive className="h-4 w-4 mr-2" /> {p.status === 'ARCHIVED' ? 'Restore' : 'Archive'}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteProduct(p)} className="text-rose-600"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      <CreateDialog
        open={createOpen}
        onOpenChange={(v) => { setCreateOpen(v); if (!v) refetch() }}
        config={{
          title: 'New Product',
          description: 'Create a new digital product. You can add files, pricing, and SEO after creation.',
          submitLabel: 'Create product',
          apiEndpoint: '/api/data/products',
          entityName: 'Product',
          fields: [
            { name: 'name', label: 'Product name', type: 'text', placeholder: 'e.g. Notion Content Planner', required: true },
            { name: 'description', label: 'Short description', type: 'textarea', placeholder: 'What does this product do?' },
            { name: 'type', label: 'Type', type: 'select', defaultValue: 'DIGITAL', options: [
              { value: 'DIGITAL', label: 'Digital Download' }, { value: 'BUNDLE', label: 'Bundle' }, { value: 'COURSE', label: 'Course' },
            ] },
            { name: 'price', label: 'Price (USD)', type: 'number', defaultValue: '29', placeholder: '29' },
          ],
        }}
      />
    </div>
  )
}

// ─── Product Editor ──────────────────────────────────────────────────────────
function ProductEditor({ product, onBack }: { product: Product; onBack: () => void }) {
  const [name, setName] = useState(product.name)
  const [description, setDescription] = useState(product.description)
  const [type, setType] = useState(product.type)
  const [price, setPrice] = useState(String(product.price))
  const [compareAt, setCompareAt] = useState(product.compareAt ? String(product.compareAt) : '')
  const [coverUrl, setCoverUrl] = useState(product.coverUrl || '')
  const [fileUrl, setFileUrl] = useState(product.fileUrl || '')
  const [status, setStatus] = useState(product.status)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'media' | 'downloads' | 'pricing' | 'seo'>('general')

  const save = async () => {
    if (!name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/data/products', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, name: name.trim(), description, type, price: parseFloat(price) || 0, compareAt: compareAt ? parseFloat(compareAt) : null, coverUrl, fileUrl, status }),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Failed') }
      toast.success('Product saved', { description: `"${name}" has been updated.` })
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } finally { setSaving(false) }
  }

  const togglePublish = async () => {
    const newStatus = status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE'
    setSaving(true)
    try {
      const res = await fetch('/api/data/products', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed')
      setStatus(newStatus)
      toast.success(newStatus === 'ACTIVE' ? 'Product published!' : 'Product unpublished')
    } catch { toast.error('Failed') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1.5" /> Products</Button>
          <Badge variant="secondary" className={cn('text-xs', (STATUS_META[status] || STATUS_META.DRAFT).cls)}>{status}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={save} disabled={saving}><Save className="h-4 w-4 mr-1.5" /> {saving ? 'Saving...' : 'Save'}</Button>
          <Button size="sm" onClick={togglePublish} disabled={saving}>
            {status === 'ACTIVE' ? <><Archive className="h-4 w-4 mr-1.5" /> Unpublish</> : <><Rocket className="h-4 w-4 mr-1.5" /> Publish</>}
          </Button>
        </div>
      </div>

      <div className="flex gap-1 border-b">
        {(['general', 'media', 'downloads', 'pricing', 'seo'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn('px-4 py-2 text-sm font-medium transition border-b-2 -mb-px capitalize',
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <Card><CardContent className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Product name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Description</Label>
            <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this product do?" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIGITAL">Digital Download</SelectItem>
                  <SelectItem value="BUNDLE">Bundle</SelectItem>
                  <SelectItem value="COURSE">Course</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent></Card>
      )}

      {activeTab === 'media' && (
        <Card><CardContent className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Cover image URL</Label>
            <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." />
            <p className="text-xs text-muted-foreground">Paste a direct image URL for the product cover</p>
          </div>
          {coverUrl && (
            <div className="rounded-lg border overflow-hidden">
              <img src={coverUrl} alt="Cover preview" className="w-full h-48 object-cover" />
            </div>
          )}
        </CardContent></Card>
      )}

      {activeTab === 'downloads' && (
        <Card><CardContent className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Download file URL</Label>
            <Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." />
            <p className="text-xs text-muted-foreground">Paste the URL where customers can download the product (ZIP, PDF, etc.)</p>
          </div>
          {fileUrl && (
            <div className="rounded-lg border p-4 flex items-center gap-3">
              <Download className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Download file</p>
                <p className="text-xs text-muted-foreground truncate">{fileUrl}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => window.open(fileUrl, '_blank')}>Test</Button>
            </div>
          )}
        </CardContent></Card>
      )}

      {activeTab === 'pricing' && (
        <Card><CardContent className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Price (USD)</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Compare-at price</Label>
              <Input type="number" value={compareAt} onChange={(e) => setCompareAt(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <p className="text-sm font-medium">Pricing Summary</p>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Current price</span><span className="font-bold text-primary">{parseFloat(price) === 0 ? 'Free' : formatCurrency(parseFloat(price) || 0)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total sales</span><span>{formatNumber(product.salesCount)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Revenue</span><span>{formatCurrency(product.revenue)}</span></div>
          </div>
        </CardContent></Card>
      )}

      {activeTab === 'seo' && (
        <Card><CardContent className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">SEO title</Label>
            <Input defaultValue={product.name} placeholder="SEO title for search engines" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">SEO description</Label>
            <Textarea rows={2} defaultValue={product.description} placeholder="Meta description for search results" />
          </div>
          <p className="text-xs text-muted-foreground">SEO settings are saved automatically with the product.</p>
        </CardContent></Card>
      )}
    </div>
  )
}
