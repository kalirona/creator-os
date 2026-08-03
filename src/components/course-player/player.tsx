'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Clock, FileText, FileQuestion, Lock, PlayCircle, Video, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useApi, formatNumber } from '@/hooks/use-api'
import { useAppStore } from '@/store/app-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui-enterprise/LoadingState'
import { ErrorState } from '@/components/ui-enterprise/ErrorState'
import { cn } from '@/lib/utils'

interface PreviewLesson {
  id: string
  title: string
  type: string
  duration: number
  isPreview: boolean
  content: string
}

interface PreviewSection {
  id: string
  title: string
  position: number
  lessons: PreviewLesson[]
}

interface PreviewCourse {
  id: string
  title: string
  description: string
  category: string
  price: number
  level: string
  rating: number
  studentsCount: number
  status: string
  thumbnailUrl?: string | null
  sections: PreviewSection[]
  totalLessons: number
  totalDuration: number
}

export function CoursePlayer({ courseId }: { courseId?: string }) {
  const router = useRouter()
  const storePreviewId = useAppStore((s) => s.previewCourseId)
  const previewCourseId = courseId ?? storePreviewId
  const { data: courses, loading, error } = useApi<PreviewCourse[]>('/api/data/courses')
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [sectionCollapsed, setSectionCollapsed] = useState<Record<string, boolean>>({})

  const course = courses?.find((c) => c.id === previewCourseId) || null
  const allLessons = course?.sections.flatMap((s) => s.lessons) || []
  const activeLesson = allLessons.find((l) => l.id === activeLessonId) || allLessons.find((l) => l.isPreview) || allLessons[0] || null
  const activeIndex = activeLesson ? allLessons.indexOf(activeLesson) : -1

  if (loading) return <LoadingState size="lg" text="Loading course preview..." />
  if (error || !course) return (
    <div className="p-8">
      <ErrorState description={error || 'Course not found.'} action={{ label: 'Go back', onClick: () => router.push('/courses') }} />
    </div>
  )

  const currentIndex = activeIndex
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null
  const unlocked = (lesson: PreviewLesson) => lesson.isPreview || lesson === activeLesson

  const renderContent = () => {
    if (!activeLesson) return (
      <div className="p-12 text-center text-sm text-muted-foreground">No lessons in this course yet.</div>
    )
    if (activeLesson.type === 'VIDEO') {
      const m = activeLesson.content.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]+)/)
      return m ? (
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
          <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${m[1]}`} title={activeLesson.title} allowFullScreen />
        </div>
      ) : (
        <div className="rounded-xl border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
          <PlayCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="font-medium text-foreground">{activeLesson.title}</p>
          <p className="mt-1 text-xs">No video URL linked to this lesson.</p>
        </div>
      )
    }
    if (activeLesson.content) {
      return (
        <div
          className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: activeLesson.content }}
        />
      )
    }
    return (
      <div className="rounded-xl border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
        <p className="font-medium text-foreground">{activeLesson.title}</p>
        <p className="mt-1 text-xs">No content for this lesson yet.</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 md:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Button size="sm" variant="ghost" onClick={() => router.push('/courses')} className="gap-1.5 shrink-0"><ArrowLeft className="h-4 w-4" />Exit preview</Button>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{course.title}</p>
              <p className="text-[10px] text-muted-foreground truncate">{course.category} · {course.level}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">{course.status}</Badge>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => router.push(`/courses/${course.id}/build`)}>
              <Video className="h-3.5 w-3.5" />Edit in Builder
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scroll-thin">
          <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-primary mb-1 uppercase tracking-wider">{course.category}</p>
                <h1 className="text-2xl font-bold">{course.title}</h1>
                <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatNumber(course.totalDuration)} min</span>
                <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{course.totalLessons} lessons</span>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5">
              {activeLesson && <div className="mb-3 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Lesson {activeIndex + 1} of {allLessons.length}</span>
                <span className="font-medium">{activeLesson.title}</span>
              </div>}
              {renderContent()}
              {(prevLesson || nextLesson) && (
                <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4">
                  {prevLesson ? (
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => setActiveLessonId(prevLesson.id)}><ChevronLeft className="h-4 w-4" />Previous</Button>
                  ) : <span />}
                  {nextLesson ? (
                    <Button size="sm" className="gap-1" onClick={() => setActiveLessonId(nextLesson.id)}>Next lesson<ChevronRight className="h-4 w-4" /></Button>
                  ) : (
                    <Button size="sm" disabled className="gap-1"><CheckCircle2 className="h-4 w-4" />Course complete</Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <aside className="hidden md:flex w-80 shrink-0 flex-col border-l border-border bg-muted/30">
        <div className="p-4 border-b border-border">
          <p className="text-sm font-semibold">Course content</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{course.sections.length} sections · {course.totalLessons} lessons · {formatNumber(course.totalDuration)} min</p>
        </div>
        <div className="flex-1 overflow-y-auto scroll-thin p-3 space-y-2">
          {course.sections.map((section) => {
            const collapsed = sectionCollapsed[section.id]
            return (
              <div key={section.id} className="rounded-lg border bg-card overflow-hidden">
                <button
                  className="flex w-full items-center gap-2 p-3 text-left hover:bg-muted/50 transition"
                  onClick={() => setSectionCollapsed((m) => ({ ...m, [section.id]: !m[section.id] }))}
                >
                  <ChevronRight className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', collapsed && 'rotate-90')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{section.title}</p>
                    <p className="text-[10px] text-muted-foreground">{section.lessons.length} lessons</p>
                  </div>
                </button>
                {!collapsed && (
                  <div className="border-t border-border">
                    {section.lessons.map((lesson) => {
                      const isActive = activeLesson?.id === lesson.id
                      const canView = unlocked(lesson)
                      const Icon = lesson.type === 'VIDEO' ? Video : lesson.type === 'QUIZ' ? FileQuestion : FileText
                      return (
                        <button
                          key={lesson.id}
                          disabled={!canView}
                          onClick={() => setActiveLessonId(lesson.id)}
                          className={cn(
                            'group flex w-full items-center gap-2.5 p-2 pl-8 text-left text-sm transition',
                            isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
                            !canView && 'opacity-60 cursor-not-allowed',
                          )}
                        >
                          {isActive ? <PlayCircle className="h-3.5 w-3.5 shrink-0" /> : <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                          <span className="flex-1 truncate text-xs">{lesson.title}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{lesson.duration}m</span>
                          {!canView ? <Lock className="h-3 w-3 text-muted-foreground shrink-0" /> : null}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </aside>

      <button onClick={() => router.push('/courses')} className="absolute top-16 right-4 md:hidden flex h-9 w-9 items-center justify-center rounded-full bg-background border shadow" aria-label="Close preview">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
