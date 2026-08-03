'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, ArrowLeft, Loader2, Check, BookOpen, Video, FileQuestion,
  FileText, Pencil, ChevronDown, ChevronRight, DollarSign,
  Rocket, Clock,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

type Step = 'form' | 'generating' | 'review'

interface Lesson {
  title: string; type: string; duration: number; objective?: string; content?: string
}
interface Module {
  title: string; summary?: string; lessons: Lesson[]
}
interface CoursePlan {
  title?: string; subtitle?: string; description?: string; category?: string; level?: string;
  targetStudent?: string; outcome?: string; duration?: string;
  modules?: Module[]
  pricing?: { price?: number; compareAt?: number; currency?: string }
  thumbnail?: { gradient?: string; emoji?: string }
}

interface GenResult {
  generationId: string; structured: Record<string, unknown>; creditsUsed: number; remainingCredits: number
}

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']
const EXAMPLES = [
  'A course teaching beginners how to start a faceless YouTube channel',
  'A course on selling Notion templates for $97',
  'A course for fitness coaches on running online programs',
  'A course teaching AI automation for small businesses',
  'A course on building a paid newsletter audience',
]

export function CourseGeneratorWizard({ onCancel }: { onCancel: () => void }) {
  const openBuilder = useAppStore((s) => s.openBuilder)
  const [step, setStep] = useState<Step>('form')

  // form
  const [topic, setTopic] = useState('')
  const [audience, setAudience] = useState('')
  const [level, setLevel] = useState('BEGINNER')
  const [moduleCount, setModuleCount] = useState(5)
  const [price, setPrice] = useState(97)

  // generation
  const [result, setResult] = useState<GenResult | null>(null)
  const [creating, setCreating] = useState(false)

  const generate = async () => {
    if (!topic.trim()) { toast.error('Describe the course topic first'); return }
    setStep('generating')
    try {
      const input = [
        `Topic: ${topic.trim()}`,
        audience.trim() ? `Target audience: ${audience.trim()}` : '',
        `Level: ${level}`,
        `Number of modules: ${moduleCount}`,
        `Target price: $${price}`,
      ].filter(Boolean).join('\n')

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 60000)
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolSlug: 'COURSE_GENERATOR', input }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      const raw = await res.text()
      if (!res.ok) {
        let msg = `Request failed (${res.status})`
        try { const j = JSON.parse(raw); if (j.error) msg = j.error } catch { }
        throw new Error(msg)
      }
      let data: GenResult
      try { data = JSON.parse(raw) } catch { throw new Error('Invalid response from AI') }

      if (!data.structured || !Array.isArray((data.structured as CoursePlan).modules)) {
        throw new Error('The AI returned an incomplete outline. Please try again.')
      }

      setResult(data)
      setStep('review')
    } catch (e) {
      toast.error(e instanceof Error ? (e.name === 'AbortError' ? 'Generation timed out. Try again.' : e.message) : 'Generation failed')
      setStep('form')
    }
  }

  const createCourse = async () => {
    if (!result) return
    setCreating(true)
    try {
      const res = await fetch('/api/ai/publish-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId: result.generationId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create course')
      toast.success('Course created!', { description: `"${data.title}" has been added to your courses.` })
      onCancel()
      setTimeout(() => openBuilder(data.courseId), 400)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create course')
    } finally {
      setCreating(false)
    }
  }

  const plan = (result?.structured || {}) as CoursePlan

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <button onClick={onCancel} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="h-4 w-4" /> Back to Courses
      </button>

      {step === 'form' && (
        <FormStep
          topic={topic} setTopic={setTopic}
          audience={audience} setAudience={setAudience}
          level={level} setLevel={setLevel}
          moduleCount={moduleCount} setModuleCount={setModuleCount}
          price={price} setPrice={setPrice}
          onGenerate={generate}
        />
      )}

      {step === 'generating' && <GeneratingStep topic={topic} />}

      {step === 'review' && result && (
        <ReviewStep
          plan={plan}
          creditsUsed={result.creditsUsed}
          creating={creating}
          onBack={() => setStep('form')}
          onCreate={createCourse}
        />
      )}
    </div>
  )
}

function FormStep({ topic, setTopic, audience, setAudience, level, setLevel, moduleCount, setModuleCount, price, setPrice, onGenerate }: {
  topic: string; setTopic: (s: string) => void
  audience: string; setAudience: (s: string) => void
  level: string; setLevel: (s: string) => void
  moduleCount: number; setModuleCount: (n: number) => void
  price: number; setPrice: (n: number) => void
  onGenerate: () => void
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 border-b p-5 bg-gradient-to-br from-primary/10 via-card to-card">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-bold">AI Course Generator</h2>
          <p className="text-xs text-muted-foreground">Design a complete, sellable course outline with modules, lessons, quizzes, and pricing.</p>
        </div>
        <Badge variant="secondary" className="ml-auto bg-primary/15 text-primary border-primary/20">15 credits</Badge>
      </div>

      <CardContent className="p-5 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">What should the course be about? <span className="text-destructive">*</span></Label>
          <Textarea rows={3} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. A course teaching beginners how to start a faceless YouTube channel and monetize it" />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => setTopic(ex)} className="rounded-full border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition">
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Who is it for?</Label>
          <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. complete beginners with zero audience" />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Level</Label>
            <div className="flex gap-1.5">
              {LEVELS.map((l) => (
                <button key={l} onClick={() => setLevel(l)}
                  className={cn('flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition capitalize', level === l ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted')}>
                  {l.toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Modules</Label>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => setModuleCount(Math.max(2, moduleCount - 1))}>-</Button>
              <span className="flex-1 text-center text-sm font-bold tabular-nums">{moduleCount}</span>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => setModuleCount(Math.min(8, moduleCount + 1))}>+</Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-1"><DollarSign className="h-3.5 w-3.5 text-muted-foreground" /> Target price</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(parseInt(e.target.value) || 0)} />
          </div>
        </div>

        <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
          <p className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500" /> Complete outline with modules, lessons & quizzes</p>
          <p className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500" /> Course title, description, and pricing</p>
          <p className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500" /> You can review and edit before creating</p>
        </div>

        <div className="flex justify-end pt-1">
          <Button onClick={onGenerate} disabled={!topic.trim()}><Sparkles className="h-4 w-4 mr-1.5" /> Generate course outline</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function GeneratingStep({ topic }: { topic: string }) {
  return (
    <Card>
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-5">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">Designing your course...</p>
            <p className="text-xs text-muted-foreground">Topic: {topic}</p>
          </div>
        </div>
        <div className="space-y-2">
          {['Analyzing topic & audience', 'Structuring modules & lessons', 'Writing lesson objectives', 'Generating quizzes & pricing', 'Polishing the outline'].map((s, i) => (
            <motion.div key={s} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.7 }}
              className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="h-3 w-3 text-emerald-500" /> {s}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ReviewStep({ plan, creditsUsed, creating, onBack, onCreate }: {
  plan: CoursePlan
  creditsUsed: number
  creating: boolean
  onBack: () => void
  onCreate: () => void
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]))
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(plan.title || 'Untitled course')
  const [price, setPrice] = useState(plan.pricing?.price ?? 97)

  const toggle = (i: number) => {
    setExpanded((prev) => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n })
  }

  const totalLessons = plan.modules?.reduce((s, m) => s + (m.lessons?.length || 0), 0) || 0
  const LessonIcon = (type: string) => type === 'VIDEO' ? Video : type === 'QUIZ' ? FileQuestion : FileText

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className={cn('h-24 bg-gradient-to-br flex items-center justify-center text-4xl', plan.thumbnail?.gradient || 'from-primary/20 via-primary/10 to-card')}>
          {plan.thumbnail?.emoji || '🎓'}
        </div>
        <CardContent className="p-5">
          {editing ? (
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-xl font-bold" autoFocus />
          ) : (
            <h2 className="text-xl font-bold flex items-center gap-2">
              {title}
              <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-primary transition"><Pencil className="h-3.5 w-3.5" /></button>
            </h2>
          )}
          {plan.subtitle && <p className="text-sm text-primary font-medium mt-1">{plan.subtitle}</p>}
          {plan.description && <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>}

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {plan.category && <Badge variant="secondary">{plan.category}</Badge>}
            {plan.level && <Badge variant="secondary" className="bg-primary/10 text-primary">{plan.level}</Badge>}
            {plan.duration && <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{plan.duration}</Badge>}
            <Badge variant="secondary"><BookOpen className="h-3 w-3 mr-1" />{plan.modules?.length || 0} modules</Badge>
            <Badge variant="secondary"><Video className="h-3 w-3 mr-1" />{totalLessons} lessons</Badge>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mt-4 pt-4 border-t">
            {plan.targetStudent && <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Target student</p><p className="text-xs mt-0.5">{plan.targetStudent}</p></div>}
            {plan.outcome && <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Outcome</p><p className="text-xs mt-0.5">{plan.outcome}</p></div>}
          </div>

          <div className="mt-4 pt-4 border-t flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <Input type="number" value={price} onChange={(e) => setPrice(parseInt(e.target.value) || 0)} className="h-8 w-24 text-sm" />
              {plan.pricing?.compareAt && <span className="text-xs text-muted-foreground line-through">${plan.pricing.compareAt}</span>}
            </div>
            <div className="flex-1" />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onBack}><ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Regenerate</Button>
              <Button size="sm" onClick={onCreate} disabled={creating}>
                {creating ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Creating...</> : <><Rocket className="h-4 w-4 mr-1.5" /> Create Course</>}
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Used {creditsUsed} credits · You can edit everything after creation in the Course Builder.</p>
        </CardContent>
      </Card>

      {/* Modules */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Course Curriculum</p>
            </div>
            <span className="text-xs text-muted-foreground">{plan.modules?.length || 0} modules · {totalLessons} lessons</span>
          </div>
          <div className="divide-y">
            {plan.modules?.map((m, i) => {
              const open = expanded.has(i)
              return (
                <div key={i}>
                  <button onClick={() => toggle(i)} className="flex w-full items-center gap-2 p-4 text-left hover:bg-muted/40 transition">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">{i + 1}</span>
                    <span className="flex-1 text-sm font-semibold">{m.title}</span>
                    <span className="text-xs text-muted-foreground">{m.lessons?.length || 0} lessons</span>
                    {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="pb-3 pl-12 pr-4 space-y-1">
                          {m.summary && <p className="text-xs text-muted-foreground py-1">{m.summary}</p>}
                          {m.lessons?.map((l, li) => {
                            const Icon = LessonIcon(l.type || 'TEXT')
                            return (
                              <div key={li} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 transition">
                                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span className="flex-1 truncate text-xs">{l.title}</span>
                                {l.duration ? <span className="text-xs text-muted-foreground shrink-0">{l.duration}m</span> : null}
                              </div>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
