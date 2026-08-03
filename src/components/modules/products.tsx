'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  DollarSign,
  Download,
  Package,
  Eye,
  Archive,
  BarChart3,
  Star,
  MoreVertical,
  Loader2,
  Copy,
  Trash2,
  Pencil,
  ArrowLeft,
  Tag,
  Globe,
  Image as ImageIcon,
  Clock,
} from 'lucide-react'
import { useApi, formatCurrency, formatNumber } from '@/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { CreateDialog } from '@/components/app/create-dialog'
import { useAppStore } from '@/store/app-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { EditorLayout } from '@/components/editor/EditorLayout'
import { EmptyState } from '@/components/ui-enterprise/EmptyState'
import { LoadingState } from '@/components/ui-enterprise/LoadingState'
import { ErrorState } from '@/components/ui-enterprise/ErrorState'
import { AppCard } from '@/components/ui-enterprise/AppCard'
import { MetricCard } from '@/components/ui-enterprise/MetricCard'
import { SearchToolbar } from '@/components/ui-enterprise/SearchToolbar'
import { FilterToolbar } from '@/components/ui-enterprise/FilterToolbar'
import { BulkToolbar } from '@/components/ui-enterprise/BulkToolbar'
import { EntityCard } from '@/components/ui-enterprise/EntityCard'
import type { EditorStatus } from '@/components/editor/EditorLayout'

interface Product {
  id: string; name: string; description: string; type: string; price: number
  compareAt: number | null; salesCount: number; rating: number; status: string
  coverUrl: string | null; fileUrl: string | null; revenue: number; createdAt: string
}

const TYPE_META: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; gradient: string; label: string }> = {
  DIGITAL: { icon: Package, color: 'text-sky-600', gradient: 'from-sky-500/20 to-cyan-500/10', label: 'Digital' },
  BUNDLE: { icon: Package, color: 'text-violet-600', gradient: 'from-violet-500/20 to-fuchsia-500/10', label: 'Bundle' },
  MEMBERSHIP: { icon: Package, color: 'text-amber-600', gradient: 'from-amber-500/20 to-orange-500/10', label: 'Membership' },
  COURSE: { icon: Package, color: 'text-emerald-600', gradient: 'from-emerald-500/20 to-teal-500/10', label: 'Course' },
}

const FILTERS = ['All', 'DIGITAL', 'BUNDLE', 'MEMBERSHIP', 'COURSE']

export function ProductsModule() {
  const { data: products, loading, error, refetch } = useApi<Product[]>('/api/data/products')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
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

  if (error) return <ErrorState description={error} action={{ label: 'Retry', onClick: refetch }} />

  const filterOptions = FILTERS.map((f) => ({
    key: f,
    label: f === 'All' ? 'All Products' : TYPE_META[f]?.label || f,
    active: filter === f,
  }))

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

  const handleFilterChange = (options: any[]) => {
    const activeFilter = options.find(o => o.active)
    setFilter(activeFilter?.key || 'All')
  }

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchToolbar
          placeholder="Search products..."
          value={query}
          onChange={setQuery}
          className="max-w-md"
        />
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> New Product
        </Button>
      </div>

      {selectedProducts.length > 0 && (
        <BulkToolbar
          selectedCount={selectedProducts.length}
          totalCount={filtered.length}
          onSelectNone={() => setSelectedProducts([])}
          actions={
            <>
              <Button size="sm" variant="outline" disabled>
                Delete selected
              </Button>
            </>
          }
        />
      )}

      {!loading && products && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { title: 'Total Products', value: products.length, icon: <Package className="h-5 w-5" /> },
            { title: 'Total Sales', value: formatNumber(totalSales, true), icon: <BarChart3 className="h-5 w-5" /> },
            { title: 'Revenue', value: formatCurrency(totalRevenue, { compact: true }), icon: <DollarSign className="h-5 w-5" /> },
            { title: 'Avg Rating', value: `${products.length ? (products.reduce((s, p) => s + p.rating, 0) / products.length).toFixed(1) : 0}★`, icon: <Star className="h-5 w-5" /> },
          ].map((s) => (
            <MetricCard key={s.title} {...s} />
          ))}
        </div>
      )}

      <FilterToolbar
        options={filterOptions}
        onChange={handleFilterChange}
      />

      {loading ? (
        <LoadingState size="lg" text="Loading products..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query ? 'No products match your search' : 'No products yet'}
          description={query ? 'Try a different search term.' : 'Create your first digital product to start selling.'}
          action={{
            label: 'New Product',
            onClick: () => setCreateOpen(true),
          }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const tm = TYPE_META[p.type] || TYPE_META.DIGITAL
            const TIcon = tm.icon
            return (
              <EntityCard
                key={p.id}
                id={p.id}
                title={p.name}
                description={p.description}
                icon={<TIcon className="h-6 w-6" />}
                status={p.status === 'ACTIVE' ? 'published' : p.status === 'DRAFT' ? 'draft' : 'archived'}
                selected={selectedProducts.includes(p.id)}
                onSelect={() => {
                  setSelectedProducts(prev =>
                    prev.includes(p.id) ? prev.filter(pid => pid !== p.id) : [...prev, p.id]
                  )
                }}
                onClick={() => p.status !== 'ARCHIVED' && setEditingProduct(p)}
                metadata={
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{p.salesCount} sales</span>
                    <span className="font-medium text-foreground">
                      {p.price === 0 ? 'Free' : formatCurrency(p.price)}
                    </span>
                  </div>
                }
                actions={
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" disabled={actionLoading === p.id}>
                        {actionLoading === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MoreVertical className="h-3.5 w-3.5" />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => setEditingProduct(p)}>
                        <Pencil className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { window.open(`/product/${p.id}`, '_blank') }}>
                        <Eye className="h-4 w-4 mr-2" /> Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { toast.info('Viewing sales'); setActiveModule('store') }}>
                        <BarChart3 className="h-4 w-4 mr-2" /> View Sales
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateProduct(p)}>
                        <Copy className="h-4 w-4 mr-2" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => toggleArchive(p)}>
                        <Archive className="h-4 w-4 mr-2" /> {p.status === 'ARCHIVED' ? 'Restore' : 'Archive'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteProduct(p)} className="text-rose-600">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                }
              />
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
  const [activeTab, setActiveTab] = useState<'general' | 'media' | 'downloads' | 'pricing' | 'seo' | 'metadata' | 'versions'>('general')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const save = async (showToast = false) => {
    if (!name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/data/products', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, name: name.trim(), description, type, price: parseFloat(price) || 0, compareAt: compareAt ? parseFloat(compareAt) : null, coverUrl, fileUrl, status }),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Failed') }
      setLastSavedAt(new Date())
      setHasUnsavedChanges(false)
      if (showToast) toast.success('Product saved', { description: `"${name}" has been updated.` })
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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    setHasUnsavedChanges(true)
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value)
    setHasUnsavedChanges(true)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      save(true)
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [save])

  const editorStatus: EditorStatus = status === 'ACTIVE' ? 'published' : status === 'ARCHIVED' ? 'draft' : 'draft'

  const leftNavItems = [
    { id: 'general', label: 'General', icon: <Pencil className="h-4 w-4" /> },
    { id: 'media', label: 'Media', icon: <ImageIcon className="h-4 w-4" /> },
    { id: 'downloads', label: 'Downloads', icon: <Download className="h-4 w-4" /> },
    { id: 'pricing', label: 'Pricing', icon: <DollarSign className="h-4 w-4" /> },
    { id: 'seo', label: 'SEO', icon: <Globe className="h-4 w-4" /> },
    { id: 'metadata', label: 'Metadata', icon: <Tag className="h-4 w-4" /> },
    { id: 'versions', label: 'Versions', icon: <Clock className="h-4 w-4" /> },
  ] as const

  return (
    <div className="h-screen">
      <EditorLayout
        leftSidebar={{
          title: 'Product',
          width: 240,
          defaultCollapsed: false,
          children: (
            <nav className="space-y-1 p-3">
              {leftNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    'w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition',
                    activeTab === item.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                  )}
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    {item.label}
                  </div>
                </button>
              ))}
            </nav>
          ),
        }}
        centerCanvas={
          <div className="flex-1 overflow-y-auto scroll-thin p-6">
            <div className="mx-auto max-w-3xl space-y-6">
              {activeTab === 'general' && (
                <AppCard padding="lg">
                  <h2 className="text-xl font-semibold mb-4">General Settings</h2>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Product name</Label>
                      <Input
                        value={name}
                        onChange={handleNameChange}
                        className="text-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Description</Label>
                      <Textarea
                        rows={4}
                        value={description}
                        onChange={handleDescriptionChange}
                        placeholder="What does this product do?"
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">Type</Label>
                        <Select value={type} onValueChange={(v) => { setType(v); setHasUnsavedChanges(true) }}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DIGITAL">Digital Download</SelectItem>
                            <SelectItem value="BUNDLE">Bundle</SelectItem>
                            <SelectItem value="COURSE">Course</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">Status</Label>
                        <Select value={status} onValueChange={(v) => { setStatus(v); setHasUnsavedChanges(true) }}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DRAFT">Draft</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="ARCHIVED">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </AppCard>
              )}

              {activeTab === 'media' && (
                <AppCard padding="lg">
                  <h2 className="text-xl font-semibold mb-4">Cover Image</h2>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Cover image URL</Label>
                      <Input
                        value={coverUrl}
                        onChange={(e) => { setCoverUrl(e.target.value); setHasUnsavedChanges(true) }}
                        placeholder="https://..."
                      />
                      <p className="text-xs text-muted-foreground">Paste a direct image URL for the product cover</p>
                    </div>
                    {coverUrl && (
                      <div className="rounded-lg border overflow-hidden">
                        <img src={coverUrl} alt="Cover preview" className="w-full h-48 object-cover" />
                      </div>
                    )}
                  </div>
                </AppCard>
              )}

              {activeTab === 'downloads' && (
                <AppCard padding="lg">
                  <h2 className="text-xl font-semibold mb-4">Download File</h2>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Download file URL</Label>
                      <Input
                        value={fileUrl}
                        onChange={(e) => { setFileUrl(e.target.value); setHasUnsavedChanges(true) }}
                        placeholder="https://..."
                      />
                      <p className="text-xs text-muted-foreground">Paste the URL where customers can download the product (ZIP, PDF, etc.)</p>
                    </div>
                    {fileUrl && (
                      <div className="rounded-lg border p-4 flex items-center gap-3">
                        <Download className="h-8 w-8 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Download file</p>
                          <p className="text-xs text-muted-foreground truncate">{fileUrl}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => window.open(fileUrl, '_blank')}>
                          Test
                        </Button>
                      </div>
                    )}
                  </div>
                </AppCard>
              )}

              {activeTab === 'pricing' && (
                <AppCard padding="lg">
                  <h2 className="text-xl font-semibold mb-4">Pricing</h2>
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">Price (USD)</Label>
                        <Input
                          type="number"
                          value={price}
                          onChange={(e) => { setPrice(e.target.value); setHasUnsavedChanges(true) }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">Compare-at price</Label>
                        <Input
                          type="number"
                          value={compareAt}
                          onChange={(e) => { setCompareAt(e.target.value); setHasUnsavedChanges(true) }}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                      <p className="text-sm font-medium">Pricing Summary</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current price</span>
                        <span className="font-bold text-primary">
                          {parseFloat(price) === 0 ? 'Free' : formatCurrency(parseFloat(price) || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total sales</span>
                        <span>{formatNumber(product.salesCount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Revenue</span>
                        <span>{formatCurrency(product.revenue)}</span>
                      </div>
                    </div>
                  </div>
                </AppCard>
              )}

              {activeTab === 'seo' && (
                <AppCard padding="lg">
                  <h2 className="text-xl font-semibold mb-4">SEO Settings</h2>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">SEO title</Label>
                      <Input
                        defaultValue={product.name}
                        placeholder="SEO title for search engines"
                        onChange={() => setHasUnsavedChanges(true)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">SEO description</Label>
                      <Textarea
                        rows={2}
                        defaultValue={product.description}
                        placeholder="Meta description for search results"
                        onChange={() => setHasUnsavedChanges(true)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">SEO settings are saved with the product.</p>
                  </div>
                </AppCard>
              )}

              {activeTab === 'metadata' && (
                <AppCard padding="lg">
                  <h2 className="text-xl font-semibold mb-4">Metadata</h2>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Slug</Label>
                      <Input
                        defaultValue={product.name.toLowerCase().replace(/\s+/g, '-')}
                        placeholder="product-slug"
                        onChange={() => setHasUnsavedChanges(true)}
                      />
                      <p className="text-xs text-muted-foreground">The URL-friendly name for this product.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">External reference ID</Label>
                      <Input
                        placeholder="Optional - e.g. SKU-001"
                        onChange={() => setHasUnsavedChanges(true)}
                      />
                    </div>
                  </div>
                </AppCard>
              )}

              {activeTab === 'versions' && (
                <AppCard padding="lg">
                  <h2 className="text-xl font-semibold mb-4">Version History</h2>
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <Clock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">No versions yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Publish your product to create a version history.
                      </p>
                    </div>
                  </div>
                </AppCard>
              )}
            </div>
          </div>
        }
        rightInspector={{
          title: 'Quick Actions',
          width: 300,
          defaultCollapsed: true,
          children: (
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <Button className="w-full" onClick={() => save(true)} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => save(false)} disabled={saving}>
                  Save draft
                </Button>
              </div>
              <div className="border-t pt-4 space-y-2">
                <Button
                  className={cn('w-full', status === 'ACTIVE' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700')}
                  onClick={togglePublish}
                  disabled={saving}
                >
                  {status === 'ACTIVE' ? 'Unpublish' : 'Publish'}
                </Button>
              </div>
            </div>
          ),
        }}
        publishBar={{
          status: editorStatus,
          lastSaved: lastSavedAt,
          hasChanges: hasUnsavedChanges,
          onSave: () => save(true),
          onPublish: togglePublish as any,
          onUnpublish: togglePublish as any,
          actions: [
            {
              label: 'Back',
              icon: <ArrowLeft className="h-4 w-4" />,
              onClick: onBack,
              variant: 'ghost',
              shortcut: 'Esc',
            },
          ],
        }}
        className="h-screen"
      />
    </div>
  )
}
