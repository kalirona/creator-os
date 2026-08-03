'use client'

import { useState, useRef } from 'react'
import { useApi } from '@/hooks/use-api'
import {
  FolderOpen, Search, Filter, SortAsc, Grid3X3, List,
  Upload, Download, Move, Trash2,
  ImageIcon, Video, FileText, File, Archive, Check,
  FolderPlus, Link2, ImagePlus,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn, formatBytes } from '@/lib/utils'
import type { MediaAsset, MediaFolder } from '@/lib/media/types'

export function MediaLibraryModule() {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'size'>('newest')
  const [filterType, setFilterType] = useState<string>('all')
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data, loading, error, refetch } = useApi<{ assets: MediaAsset[]; total: number; folders: MediaFolder[] }>(
    `/api/media?folderId=${selectedFolder || ''}&search=${encodeURIComponent(search)}&page=1&perPage=96`,
    [selectedFolder, search, sortBy, filterType]
  )

  const handleUpload = async (files: FileList) => {
    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      if (selectedFolder) formData.append('folderId', selectedFolder)
      try {
        const res = await fetch('/api/media', { method: 'POST', body: formData, credentials: 'include' })
        if (!res.ok) throw new Error('Upload failed')
        toast.success(`Uploaded ${file.name}`)
      } catch {
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    refetch()
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      const res = await fetch('/api/media/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName.trim(), parentId: selectedFolder }),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(`Folder "${newFolderName}" created`)
      setNewFolderName('')
      setNewFolderOpen(false)
      refetch()
    } catch {
      toast.error('Failed to create folder')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this asset? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Asset deleted')
      refetch()
    } catch {
      toast.error('Failed to delete asset')
    }
  }

  const handleMove = async (assetId: string, folderId: string | null) => {
    try {
      const res = await fetch(`/api/media/${assetId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId }),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Asset moved')
      refetch()
    } catch {
      toast.error('Failed to move asset')
    }
  }

  const filteredAssets = data?.assets || []

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-card/50">
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-1.5" /> Upload
        </Button>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => { if (e.target.files) handleUpload(e.target.files) }} />

        <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm"><FolderPlus className="h-4 w-4 mr-1.5" /> New Folder</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Folder</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Folder name" />
              <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search assets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="h-9 w-[130px]">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="archive">Archives</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v: typeof sortBy) => setSortBy(v)}>
          <SelectTrigger className="h-9 w-[120px]">
            <SortAsc className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="size">Size</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-0.5">
          <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9" onClick={() => setView('grid')}>
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9" onClick={() => setView('list')}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-56 shrink-0 border-r overflow-y-auto scroll-thin p-3 space-y-1">
          <button
            className={cn('flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-muted', selectedFolder === null && 'bg-muted font-medium')}
            onClick={() => { setSelectedFolder(null) }}
          >
            <FolderOpen className="h-3.5 w-3.5 shrink-0" />
            <span>All Assets</span>
          </button>
          <Separator className="my-2" />
          {(data?.folders || []).map((folder) => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolder(folder.id)}
              className={cn('flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-muted', selectedFolder === folder.id && 'bg-muted font-medium')}
            >
              <FolderOpen className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{folder.name}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{folder._count?.assets || 0}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Loading assets...</div></div>
          ) : error ? (
            <div className="flex items-center justify-center h-64"><div className="text-destructive">Failed to load assets</div></div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <ImagePlus className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">No assets found</p>
              <p className="text-xs mt-1">Upload files or create a folder to get started</p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {filteredAssets.map((asset) => {
                const isSelected = selectedAssets.has(asset.id)
                const Icon = asset.mimeType.startsWith('image/') ? ImageIcon : asset.mimeType.startsWith('video/') ? Video : asset.mimeType === 'application/pdf' ? FileText : File
                return (
                  <Card key={asset.id} className={cn('overflow-hidden group cursor-pointer transition-all', isSelected && 'ring-2 ring-primary shadow-md')}>
                    <div className="relative aspect-square bg-muted/30 flex items-center justify-center">
                      <Icon className="h-10 w-10 text-muted-foreground/40" />
                      <div className={cn('absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition', isSelected && 'opacity-100')}>
                        <Button size="icon" variant="secondary" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setSelectedAssets((prev) => { const next = new Set(prev); if (next.has(asset.id)) { next.delete(asset.id) } else { next.add(asset.id) } return next }) }}>
                          <Check className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-2">
                      <p className="text-xs font-medium truncate" title={asset.originalName}>{asset.originalName}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">{formatBytes(asset.fileSize)}</span>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => navigator.clipboard.writeText(asset.url)}><Link2 className="h-3 w-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => handleMove(asset.id, null)}><Move className="h-3 w-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => handleDelete(asset.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredAssets.map((asset) => {
                const isSelected = selectedAssets.has(asset.id)
                return (
                  <div key={asset.id} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition cursor-pointer', isSelected && 'bg-muted')} onClick={() => setSelectedAssets((prev) => { const next = new Set(prev); if (next.has(asset.id)) { next.delete(asset.id) } else { next.add(asset.id) } return next })}>
                    <ImageIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{asset.originalName}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(asset.fileSize)}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{asset.mimeType.split('/')[1]}</Badge>
                    <span className="text-[10px] text-muted-foreground hidden sm:inline">{new Date(asset.createdAt).toLocaleDateString()}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="w-72 shrink-0 border-l overflow-y-auto scroll-thin p-4">
          {selectedAssets.size === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Select an asset to inspect</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Selected ({selectedAssets.size})</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => toast.info('Download started')}><Download className="h-3.5 w-3.5 mr-1" /> Download</Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => toast.info('Moved to folder')}><Move className="h-3.5 w-3.5 mr-1" /> Move</Button>
              </div>
              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bulk Actions</p>
              <div className="space-y-1.5">
                <Button size="sm" variant="ghost" className="w-full justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => { if (confirm(`Delete ${selectedAssets.size} assets?`)) toast.success('Deleted') }}><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete all</Button>
                <Button size="sm" variant="ghost" className="w-full justify-start" onClick={() => toast.success('ZIP download started')}><Archive className="h-3.5 w-3.5 mr-2" /> Download as ZIP</Button>
                <Button size="sm" variant="ghost" className="w-full justify-start" onClick={() => toast.success('Assigned to folder')}><FolderOpen className="h-3.5 w-3.5 mr-2" /> Assign folder</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}