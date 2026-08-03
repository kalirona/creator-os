'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Star, Users, PlayCircle, Plus, GraduationCap, Sparkles, BookOpen,
   MoreVertical, Pencil, Copy, Trash2, Eye, BarChart3, Rocket, Archive, Loader2
} from 'lucide-react'
import { useApi, formatCurrency, formatNumber } from '@/hooks/use-api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { CreateDialog } from '@/components/app/create-dialog'
import { CourseGeneratorWizard } from '@/components/course-generator/generator'
import { useAppStore } from '@/store/app-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { StatGrid } from '@/components/ui-enterprise/StatGrid'
import { LoadingState } from '@/components/ui-enterprise/LoadingState'
import { ErrorState } from '@/components/ui-enterprise/ErrorState'
import { EmptyState } from '@/components/ui-enterprise/EmptyState'
import { SearchToolbar } from '@/components/ui-enterprise/SearchToolbar'

interface Lesson { id: string; title: string; type: string; duration: number; isPreview: boolean; content: string }
interface Section { id: string; title: string; position: number; lessons: Lesson[] }
interface Course {
  id: string; title: string; description: string; category: string; price: number; level: string;
  rating: number; studentsCount: number; status: string; sections: Section[];
  totalLessons: number; totalDuration: number; thumbnailUrl?: string | null; createdBy?: string | null;
}

const LEVEL_STYLES: Record<string, string> = {
  BEGINNER: 'bg-emerald-500/10 text-emerald-600',
  INTERMEDIATE: 'bg-amber-500/10 text-amber-600',
  ADVANCED: 'bg-rose-500/10 text-rose-600',
}

const COVER_GRADIENTS = [
  'from-emerald-500/20 to-teal-500/10',
  'from-violet-500/20 to-fuchsia-500/10',
  'from-amber-500/20 to-orange-500/10',
  'from-sky-500/20 to-cyan-500/10',
  'from-rose-500/20 to-pink-500/10',
  'from-indigo-500/20 to-purple-500/10',
]

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PUBLISHED: { label: 'Published', cls: 'bg-emerald-500/10 text-emerald-600' },
  DRAFT: { label: 'Draft', cls: 'bg-amber-500/10 text-amber-600' },
  ARCHIVED: { label: 'Archived', cls: 'bg-muted text-muted-foreground' },
}

export function CoursesModule() {
  const { data: courses, loading, error, refetch } = useApi<Course[]>('/api/data/courses')
  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const setActiveModule = useAppStore((s) => s.setActiveModule)
  const router = useRouter()

  // Auto-open create dialog when triggered from topbar
  const createDialogFor = useAppStore((s) => s.createDialogFor)
  const clearCreateDialog = useAppStore((s) => s.clearCreateDialog)
  useEffect(() => {
    if (createDialogFor === 'courses') {
      const t = setTimeout(() => { setCreateOpen(true); clearCreateDialog() }, 0)
      return () => clearTimeout(t)
    }
  }, [createDialogFor, clearCreateDialog])

  // If generating, show the AI course generator wizard
  if (generating) {
    return <CourseGeneratorWizard onCancel={() => setGenerating(false)} />
  }

  const filtered = (courses || []).filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase()))

  // Course actions
  const deleteCourse = async (course: Course) => {
    if (!confirm(`Delete "${course.title}"? This will permanently remove the course and all its lessons. This cannot be undone.`)) return
    setActionLoading(course.id)
    try {
      const res = await fetch(`/api/data/courses?id=${course.id}`, { method: 'DELETE' })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Failed') }
      toast.success('Course deleted', { description: `"${course.title}" has been permanently removed.` })
      refetch()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } finally { setActionLoading(null) }
  }

  const duplicateCourse = async (course: Course) => {
    setActionLoading(course.id)
    try {
      const res = await fetch(`/api/data/courses/duplicate?id=${course.id}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Course duplicated', { description: `"${course.title} (Copy)" has been created as a draft.` })
      refetch()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } finally { setActionLoading(null) }
  }

  const togglePublish = async (course: Course) => {
    const newStatus = course.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    setActionLoading(course.id)
    try {
      const res = await fetch('/api/data/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: course.id, status: newStatus }),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Failed') }
      toast.success(newStatus === 'PUBLISHED' ? 'Course published' : 'Course unpublished', {
        description: `"${course.title}" is now ${newStatus === 'PUBLISHED' ? 'live and visible to students' : 'a draft'}.`
      })
      refetch()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } finally { setActionLoading(null) }
  }

  const archiveCourse = async (course: Course) => {
    setActionLoading(course.id)
    try {
      const res = await fetch('/api/data/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: course.id, status: 'ARCHIVED' }),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Failed') }
      toast.success('Course archived', { description: `"${course.title}" has been archived.` })
      refetch()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed') } finally { setActionLoading(null) }
  }

  return (
    <div className="space-y-5">
       <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
         <SearchToolbar
           placeholder="Search courses..."
           value={query}
           onChange={(value) => setQuery(value)}
         />
           <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setGenerating(true)}>
              <Sparkles className="h-4 w-4 mr-1.5 text-primary" /> Generate with AI
            </Button>
           <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> New Course</Button>
         </div>
       </div>

       {/* Stats strip */}
       {!loading && courses && courses.length > 0 && (
         <StatGrid
           columns={4}
           items={[
             { label: 'Total Courses', value: courses.length, icon: GraduationCap, color: 'primary' },
             { label: 'Total Students', value: formatNumber(courses.reduce((s, c) => s + c.studentsCount, 0), true), icon: Users, color: 'success' },
             { label: 'Avg Rating', value: `${(courses.reduce((s, c) => s + c.rating, 0) / courses.length).toFixed(1)}â˜…`, icon: Star, color: 'warning' },
             { label: 'Total Lessons', value: courses.reduce((s, c) => s + c.totalLessons, 0), icon: BookOpen, color: 'muted' },
           ]}
         />
       )}

       {loading ? (
        <LoadingState size="lg" text="Loading courses..." />
      ) : error ? (
        <ErrorState description={error} action={{ label: 'Retry', onClick: refetch }} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query ? 'No courses match your search' : 'No courses yet'}
          description={query ? 'Try a different search term.' : 'Create your first course to start teaching.'}
          icon={<GraduationCap className="h-8 w-8" />}
          action={{ label: 'New Course', onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, i) => {
            const sm = STATUS_META[c.status] || STATUS_META.DRAFT
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="group overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all flex flex-col h-full">
                  {/* Cover */}
                  <div className={cn('relative h-32 bg-gradient-to-br cursor-pointer', COVER_GRADIENTS[i % COVER_GRADIENTS.length])} onClick={() => router.push(`/courses/${c.id}/build`)}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <GraduationCap className="h-12 w-12 text-foreground/30" />
                    </div>
                    <Badge className="absolute top-3 left-3" variant="secondary">{c.category}</Badge>
                    <Badge className={cn('absolute top-3 right-3', LEVEL_STYLES[c.level])} variant="secondary">{c.level}</Badge>
                    <Badge className={cn('absolute bottom-3 right-3 text-xs', sm.cls)} variant="secondary">{sm.label}</Badge>
                  </div>

                  <CardContent className="p-4 flex flex-col flex-1">
                    <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition cursor-pointer" onClick={() => router.push(`/courses/${c.id}/build`)}>{c.title}</h3>
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 flex-1">{c.description}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{c.rating}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{formatNumber(c.studentsCount, true)}</span>
                      <span className="flex items-center gap-1"><PlayCircle className="h-3 w-3" />{c.totalLessons}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t pt-3">
                      <span className="text-sm font-bold text-primary">{c.price === 0 ? 'Free' : formatCurrency(c.price)}</span>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-8 text-xs gap-1" onClick={() => router.push(`/courses/${c.id}/build`)}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" disabled={actionLoading === c.id}>
                              {actionLoading === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MoreVertical className="h-3.5 w-3.5" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => router.push(`/courses/${c.id}/preview`)}><Eye className="h-4 w-4 mr-2" /> Preview</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { toast.info('Opening analytics', { description: `Loading analytics for "${c.title}"` }); setActiveModule('analytics') }}><BarChart3 className="h-4 w-4 mr-2" /> View Analytics</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateCourse(c)}><Copy className="h-4 w-4 mr-2" /> Duplicate</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {c.status === 'PUBLISHED' ? (
                              <DropdownMenuItem onClick={() => togglePublish(c)}><Archive className="h-4 w-4 mr-2" /> Unpublish</DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => togglePublish(c)}><Rocket className="h-4 w-4 mr-2" /> Publish</DropdownMenuItem>
                            )}
                            {c.status !== 'ARCHIVED' && (
                              <DropdownMenuItem onClick={() => archiveCourse(c)}><Archive className="h-4 w-4 mr-2" /> Archive</DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => deleteCourse(c)} className="text-rose-600 focus:text-rose-700"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
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
          title: 'New Course',
          description: 'Create a new course. You can add lessons and sections after creation.',
          aiHint: 'Want AI to design the full course outline for you? Use the Course Generator.',
          submitLabel: 'Create course',
          apiEndpoint: '/api/data/courses',
          entityName: 'Course',
          onCreated: (data) => {
            if (data?.id) {
              // Auto-open the builder for the newly created course
              setTimeout(() => router.push(`/courses/${data.id}/build`), 300)
            }
          },
          fields: [
            { name: 'title', label: 'Course title', type: 'text', placeholder: 'e.g. Mastering Notion for Creators', required: true },
            { name: 'description', label: 'Short description', type: 'textarea', placeholder: 'What will students learn?' },
            { name: 'category', label: 'Category', type: 'select', defaultValue: 'Marketing', options: [
              { value: 'Marketing', label: 'Marketing' }, { value: 'YouTube', label: 'YouTube' }, { value: 'Community', label: 'Community' },
              { value: 'Email', label: 'Email' }, { value: 'Productivity', label: 'Productivity' }, { value: 'AI', label: 'AI' },
            ] },
            { name: 'level', label: 'Level', type: 'select', defaultValue: 'BEGINNER', options: [
              { value: 'BEGINNER', label: 'Beginner' }, { value: 'INTERMEDIATE', label: 'Intermediate' }, { value: 'ADVANCED', label: 'Advanced' },
            ] },
            { name: 'price', label: 'Price (USD)', type: 'number', defaultValue: '99', placeholder: '99' },
          ],
        }}
      />
    </div>
  )
}
