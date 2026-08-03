'use client'
import { FolderOpen, Plus, Image as ImageIcon, Video, FileText, Download } from 'lucide-react'
import { StatGrid } from '@/components/ui-enterprise/StatGrid'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function MediaLibraryModule() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Manage images, videos, and files for your courses and products.</p>
        <Button size="sm" onClick={() => toast.info('Upload', { description: 'Drag and drop files or click to browse.' })}>
          <Plus className="h-4 w-4 mr-1.5" /> Upload
        </Button>
      </div>

      <StatGrid
        columns={4}
        items={[
          { label: 'Images', value: '24', icon: ImageIcon, color: 'primary' },
          { label: 'Videos', value: '8', icon: Video, color: 'warning' },
          { label: 'Documents', value: '12', icon: FileText, color: 'muted' },
          { label: 'Storage', value: '1.2 GB', icon: FolderOpen, color: 'success' },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {[
          { name: 'course-thumbnail.jpg', type: 'image', size: '2.4 MB', color: 'from-sky-500/20 to-cyan-500/10' },
          { name: 'lesson-video.mp4', type: 'video', size: '124 MB', color: 'from-violet-500/20 to-fuchsia-500/10' },
          { name: 'worksheet.pdf', type: 'doc', size: '1.2 MB', color: 'from-amber-500/20 to-orange-500/10' },
          { name: 'template.zip', type: 'doc', size: '8.5 MB', color: 'from-emerald-500/20 to-teal-500/10' },
          { name: 'promo-image.png', type: 'image', size: '1.8 MB', color: 'from-rose-500/20 to-pink-500/10' },
          { name: 'intro-video.mp4', type: 'video', size: '56 MB', color: 'from-indigo-500/20 to-purple-500/10' },
        ].map((file, i) => {
          const Icon = file.type === 'image' ? ImageIcon : file.type === 'video' ? Video : FileText
          return (
            <Card key={i} className="overflow-hidden group hover:shadow-lg transition cursor-pointer">
              <div className={cn('relative h-24 bg-gradient-to-br flex items-center justify-center', file.color)}>
                <Icon className="h-8 w-8 text-foreground/30" />
              </div>
              <CardContent className="p-2.5">
                <p className="text-xs font-medium truncate">{file.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] text-muted-foreground">{file.size}</span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => toast.success('File downloaded')}>
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
