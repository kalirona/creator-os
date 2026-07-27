'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Star, Users, Clock, PlayCircle, Lock, FileText, Video, FileQuestion, ArrowLeft, Plus, GraduationCap, Sparkles, CheckCircle2, Circle, BookOpen } from 'lucide-react'
import { useApi, formatCurrency, formatNumber } from '@/hooks/use-api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'

interface Lesson { id: string; title: string; type: string; duration: number; isPreview: boolean; content: string }
interface Section { id: string; title: string; position: number; lessons: Lesson[] }
interface Course {
  id: string; title: string; description: string; category: string; price: number; level: string;
  rating: number; studentsCount: number; status: string; sections: Section[];
  totalLessons: number; totalDuration: number;
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

export function CoursesModule() {
  const { data: courses, loading } = useApi<Course[]>('/api/data/courses')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Course | null>(null)
  const setActiveModule = useAppStore((s) => s.setActiveModule)

  if (selected) {
    return <CourseDetail course={selected} onBack={() => setSelected(null)} />
  }

  const filtered = (courses || []).filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search courses..." className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setActiveModule('ai-studio')}>
            <Sparkles className="h-4 w-4 mr-1.5 text-primary" /> Generate with AI
          </Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> New Course</Button>
        </div>
      </div>

      {/* Stats strip */}
      {!loading && courses && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Courses', value: courses.length, icon: GraduationCap },
            { label: 'Total Students', value: formatNumber(courses.reduce((s, c) => s + c.studentsCount, 0), true), icon: Users },
            { label: 'Avg Rating', value: `${(courses.reduce((s, c) => s + c.rating, 0) / courses.length).toFixed(1)}★`, icon: Star },
            { label: 'Total Lessons', value: courses.reduce((s, c) => s + c.totalLessons, 0), icon: BookOpen },
          ].map((s) => {
            const Icon = s.icon
            return (
              <Card key={s.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary"><Icon className="h-4 w-4" /></div>
                  <div>
                    <p className="text-lg font-bold tabular-nums leading-none">{s.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="group cursor-pointer overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all" onClick={() => setSelected(c)}>
                <div className={cn('relative h-32 bg-gradient-to-br', COVER_GRADIENTS[i % COVER_GRADIENTS.length])}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <GraduationCap className="h-12 w-12 text-foreground/30" />
                  </div>
                  <Badge className="absolute top-3 left-3" variant="secondary">{c.category}</Badge>
                  <Badge className={cn('absolute top-3 right-3', LEVEL_STYLES[c.level])} variant="secondary">{c.level}</Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition">{c.title}</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{c.rating}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{formatNumber(c.studentsCount, true)}</span>
                    <span className="flex items-center gap-1"><PlayCircle className="h-3 w-3" />{c.totalLessons}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t pt-3">
                    <span className="text-sm font-bold text-primary">{c.price === 0 ? 'Free' : formatCurrency(c.price)}</span>
                    <Button size="sm" variant="ghost" className="h-7 text-xs">View</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function CourseDetail({ course, onBack }: { course: Course; onBack: () => void }) {
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(course.sections[0]?.lessons[0] || null)
  const totalLessons = course.totalLessons
  const progress = totalLessons ? Math.round((completed.size / totalLessons) * 100) : 0

  const toggle = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="h-4 w-4" /> Back to courses
      </button>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* Main */}
        <div className="space-y-4">
          {/* Video player area */}
          <Card className="overflow-hidden">
            <div className={cn('relative aspect-video bg-gradient-to-br', COVER_GRADIENTS[0])}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background/80 backdrop-blur hover:scale-110 transition cursor-pointer">
                  <PlayCircle className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-4">
                <Badge variant="secondary" className="mb-1">{activeLesson?.type || 'VIDEO'}</Badge>
                <p className="text-white font-medium text-sm">{activeLesson?.title}</p>
              </div>
            </div>
          </Card>

          {/* Course header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{course.category}</Badge>
              <Badge variant="secondary" className={LEVEL_STYLES[course.level]}>{course.level}</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{course.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{course.rating} rating</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{formatNumber(course.studentsCount)} students</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{Math.floor(course.totalDuration / 60)}h {course.totalDuration % 60}m</span>
              <span className="flex items-center gap-1.5"><PlayCircle className="h-4 w-4" />{course.totalLessons} lessons</span>
            </div>
          </div>

          {/* Lesson content */}
          {activeLesson && (
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-2">{activeLesson.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{activeLesson.content}</p>
                <div className="mt-4 flex items-center gap-2">
                  <Button size="sm" variant={completed.has(activeLesson.id) ? 'default' : 'outline'} onClick={() => toggle(activeLesson.id)}>
                    {completed.has(activeLesson.id) ? <><CheckCircle2 className="h-4 w-4 mr-1.5" /> Completed</> : <><Circle className="h-4 w-4 mr-1.5" /> Mark complete</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: curriculum */}
        <Card className="h-fit lg:sticky lg:top-4">
          <CardContent className="p-4">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">Your progress</p>
                <span className="text-sm font-bold text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="flex items-center justify-between mb-3 pb-3 border-b">
              <span className="text-2xl font-bold text-primary">{course.price === 0 ? 'Free' : formatCurrency(course.price)}</span>
              <Button size="sm">Enroll</Button>
            </div>
            <ScrollArea className="h-[420px] scroll-thin -mr-2 pr-2">
              <div className="space-y-4">
                {course.sections.map((s) => (
                  <div key={s.id}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">{s.title}</p>
                    <div className="space-y-0.5">
                      {s.lessons.map((l) => {
                        const Icon = l.type === 'VIDEO' ? Video : l.type === 'PDF' ? FileText : l.type === 'QUIZ' ? FileQuestion : FileText
                        const isActive = activeLesson?.id === l.id
                        const done = completed.has(l.id)
                        return (
                          <button key={l.id} onClick={() => setActiveLesson(l)}
                            className={cn('group flex w-full items-center gap-2.5 rounded-lg p-2 text-left text-sm transition',
                              isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted')}>
                            <button onClick={(e) => { e.stopPropagation(); toggle(l.id) }} className="shrink-0">
                              {done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />}
                            </button>
                            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="flex-1 truncate text-xs">{l.title}</span>
                            <span className="text-[10px] text-muted-foreground shrink-0">{l.duration}m</span>
                            {l.isPreview ? <Badge variant="secondary" className="text-[9px] h-4 px-1 shrink-0">Free</Badge>
                              : <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
