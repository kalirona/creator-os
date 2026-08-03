'use client'

import {
  Megaphone, Type, FileText, Star, Layout, ShoppingCart, HelpCircle, Video,
  Image as ImageIcon, Clock, Mail, Plus, Palette, RotateCcw, ImagePlus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export interface Section {
  id: string
  pageId: string
  type: string
  content: Record<string, unknown>
  position: number
  isHidden: boolean
}

export interface SectionStyle {
  align?: 'left' | 'center' | 'right'
  background?: string
  backgroundImage?: string
  paddingY?: number
  paddingX?: number
  maxWidth?: number
  borderRadius?: number
  borderWidth?: number
  borderColor?: string
  shadow?: string
  animation?: string
}

export const SECTION_TYPES = [
  { type: 'HERO', name: 'Hero', icon: Megaphone, desc: 'Headline + CTA' },
  { type: 'HEADING', name: 'Heading', icon: Type, desc: 'Section title' },
  { type: 'TEXT', name: 'Text', icon: FileText, desc: 'Paragraph' },
  { type: 'BENEFITS', name: 'Benefits', icon: Star, desc: 'Outcome benefits' },
  { type: 'FEATURES', name: 'Features', icon: Layout, desc: 'Feature grid' },
  { type: 'PRICING', name: 'Pricing', icon: ShoppingCart, desc: 'Pricing tiers' },
  { type: 'TESTIMONIALS', name: 'Testimonials', icon: Star, desc: 'Social proof' },
  { type: 'FAQ', name: 'FAQ', icon: HelpCircle, desc: 'Q&A' },
  { type: 'VIDEO', name: 'Video', icon: Video, desc: 'Embed video' },
  { type: 'GALLERY', name: 'Gallery', icon: ImageIcon, desc: 'Image gallery' },
  { type: 'COUNTDOWN', name: 'Countdown', icon: Clock, desc: 'Timer' },
  { type: 'CTA', name: 'Call to Action', icon: Megaphone, desc: 'Conversion CTA' },
  { type: 'NEWSLETTER', name: 'Newsletter', icon: Mail, desc: 'Email capture' },
  { type: 'FOOTER', name: 'Footer', icon: Layout, desc: 'Page footer' },
]

type SetField = (path: string, value: unknown) => void

function setPath(root: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const next = JSON.parse(JSON.stringify(root)) as Record<string, unknown>
  const parts = path.split('.')
  let node = next
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]
    const child = (node[key] as Record<string, unknown> | undefined) || {}
    node[key] = child
    node = child
  }
  node[parts[parts.length - 1]] = value
  return next
}

// ---------------------------------------------------------------------------
// Reusable setting controls — polished like openfunnels PropertiesPanel
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h4 className="flex items-center text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-2 mt-4 first:mt-0">{children}</h4>
}

function CInput({ label, value, set, textarea, placeholder }: { label: string; value: string | undefined; set: (v: string) => void; textarea?: boolean; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground/80">{label}</Label>
      {textarea ? (
        <Textarea className="text-sm" rows={3} value={value ?? ''} placeholder={placeholder} onChange={(e) => set(e.target.value)} />
      ) : (
        <Input className="h-9 text-sm" value={value ?? ''} placeholder={placeholder} onChange={(e) => set(e.target.value)} />
      )}
    </div>
  )
}

function CSelect({ value, options, set }: { value: string | undefined; options: { value: string; label: string }[]; set: (v: string) => void }) {
  return (
    <Select value={value ?? ''} onValueChange={set}>
      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
    </Select>
  )
}

function CSlider({ label, value, set, min, max, step = 1, unit = 'px' }: { label: string; value: number | undefined; set: (v: number) => void; min: number; max: number; step?: number; unit?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-foreground/80">{label}</Label>
        <span className="text-[10px] text-muted-foreground tabular-nums font-mono">{value != null ? `${value}${unit}` : '—'}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[value ?? min]} onValueChange={(v) => set(v[0])} />
    </div>
  )
}

function CColor({ value, set, label }: { value: string | undefined; set: (v: string | undefined) => void; label: string }) {
  const hex = value && value !== 'transparent' ? value : '#ffffff'
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-foreground/80">{label}</Label>
      <div className="flex items-center gap-2">
        <label className="relative flex h-9 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border bg-background shadow-sm">
          <input type="color" value={hex} onChange={(e) => set(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
          <span className={cn('h-5 w-8 rounded-sm border border-black/10', value && value === 'transparent' && 'bg-muted')} style={{ backgroundColor: value && value !== 'transparent' ? value : undefined }} />
        </label>
        <Input className="h-9 flex-1 font-mono text-xs" value={value ?? ''} onChange={(e) => set(e.target.value || undefined)} placeholder="#fff / transparent" />
        {value ? <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => set(undefined)}><RotateCcw className="h-3.5 w-3.5" /></Button> : null}
      </div>
    </div>
  )
}

function CImage({ value, set, label }: { value: string | undefined; set: (v: string | undefined) => void; label: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-foreground/80">{label}</Label>
      <div className="flex items-center gap-2">
        <Input className="h-9 flex-1 text-sm" value={value ?? ''} placeholder="https://..." onChange={(e) => set(e.target.value || undefined)} />
        {value ? (
          <img src={value} alt="" className="h-9 w-9 rounded-md object-cover border" />
        ) : (
          <div className="h-9 w-9 rounded-md border border-dashed flex items-center justify-center text-muted-foreground"><ImagePlus className="h-4 w-4" /></div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Style tab
// ---------------------------------------------------------------------------

function SectionStyleFields({ content, set }: { content: Record<string, unknown>; set: SetField }) {
  const s = (content.style as SectionStyle | undefined) || {}
  return (
    <div className="space-y-1">
      <SectionLabel>Alignment</SectionLabel>
      <CSelect value={s.align ?? ''} options={[{ value: 'auto', label: 'Auto' }, { value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} set={(v) => set('style.align', v === 'auto' ? undefined : v)} />

      <SectionLabel>Background</SectionLabel>
      <CColor label="Color" value={s.background} set={(v) => set('style.background', v)} />
      <CImage label="Image URL" value={s.backgroundImage} set={(v) => set('style.backgroundImage', v)} />

      <SectionLabel>Spacing</SectionLabel>
      <CSlider label="Padding Y" value={s.paddingY} set={(v) => set('style.paddingY', v)} min={0} max={160} step={4} />
      <CSlider label="Padding X" value={s.paddingX} set={(v) => set('style.paddingX', v)} min={0} max={80} step={4} />
      <CSlider label="Max width" value={s.maxWidth} set={(v) => set('style.maxWidth', v)} min={400} max={1400} step={20} />

      <SectionLabel>Border</SectionLabel>
      <CSlider label="Radius" value={s.borderRadius} set={(v) => set('style.borderRadius', v)} min={0} max={48} step={2} unit="px" />
      <CSlider label="Width" value={s.borderWidth} set={(v) => set('style.borderWidth', v)} min={0} max={8} step={1} unit="px" />
      <CColor label="Color" value={s.borderColor} set={(v) => set('style.borderColor', v)} />

      <SectionLabel>Shadow</SectionLabel>
      <CSelect value={s.shadow} options={[{ value: '', label: 'None' }, { value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }]} set={(v) => set('style.shadow', v || undefined)} />

      <p className="text-[10px] text-muted-foreground mt-4">Style values render on the live page and on published pages.</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Content tab — per-section-type editable fields
// ---------------------------------------------------------------------------

function SectionFields({ type, content, set }: { type: string; content: Record<string, unknown>; set: SetField }) {
  if (type === 'HERO') return (
    <>
      <SectionLabel>Content</SectionLabel>
      <CInput label="Emoji" value={content.emoji as string | undefined} set={(v) => set('emoji', v)} />
      <CInput label="Headline" value={content.headline as string | undefined} set={(v) => set('headline', v)} />
      <CInput label="Subheadline" textarea value={content.subheadline as string | undefined} set={(v) => set('subheadline', v)} />
      <CInput label="Primary CTA" value={content.ctaText as string | undefined} set={(v) => set('ctaText', v)} />
      <CInput label="Secondary CTA" value={content.ctaSecondary as string | undefined} set={(v) => set('ctaSecondary', v)} />
    </>
  )
  if (type === 'HEADING') return (
    <>
      <SectionLabel>Content</SectionLabel>
      <CInput label="Heading text" value={content.text as string | undefined} set={(v) => set('text', v)} />
      <div><Label className="text-xs font-medium text-foreground/80">Alignment</Label><CSelect value={content.alignment as string | undefined} options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} set={(v) => set('alignment', v)} /></div>
    </>
  )
  if (type === 'TEXT') return (
    <>
      <SectionLabel>Content</SectionLabel>
      <CInput label="Paragraph" textarea value={content.text as string | undefined} set={(v) => set('text', v)} />
    </>
  )
  if (type === 'CTA') return (
    <>
      <SectionLabel>Content</SectionLabel>
      <CInput label="Headline" value={content.headline as string | undefined} set={(v) => set('headline', v)} />
      <CInput label="Subtext" textarea value={content.subtext as string | undefined} set={(v) => set('subtext', v)} />
      <CInput label="Button text" value={content.ctaText as string | undefined} set={(v) => set('ctaText', v)} />
    </>
  )
  if (type === 'NEWSLETTER') return (
    <>
      <SectionLabel>Content</SectionLabel>
      <CInput label="Heading" value={content.heading as string | undefined} set={(v) => set('heading', v)} />
      <CInput label="Subtext" value={content.subtext as string | undefined} set={(v) => set('subtext', v)} />
      <CInput label="Input placeholder" value={content.placeholder as string | undefined} set={(v) => set('placeholder', v)} />
      <CInput label="Button text" value={content.ctaText as string | undefined} set={(v) => set('ctaText', v)} />
    </>
  )
  if (type === 'VIDEO') return (
    <>
      <SectionLabel>Content</SectionLabel>
      <CInput label="Heading" value={content.heading as string | undefined} set={(v) => set('heading', v)} />
      <CInput label="Video URL" value={content.videoUrl as string | undefined} set={(v) => set('videoUrl', v)} />
      <CInput label="Description" textarea value={content.description as string | undefined} set={(v) => set('description', v)} />
    </>
  )
  if (type === 'COUNTDOWN') return (
    <>
      <SectionLabel>Content</SectionLabel>
      <CInput label="Heading" value={content.heading as string | undefined} set={(v) => set('heading', v)} />
      <CInput label="End date (ISO)" value={content.endDate as string | undefined} set={(v) => set('endDate', v)} />
      <CInput label="CTA text" value={content.ctaText as string | undefined} set={(v) => set('ctaText', v)} />
    </>
  )
  if (type === 'FOOTER') return (
    <>
      <SectionLabel>Content</SectionLabel>
      <CInput label="Brand name" value={content.brand as string | undefined} set={(v) => set('brand', v)} />
      <CInput label="Tagline" value={content.tagline as string | undefined} set={(v) => set('tagline', v)} />
    </>
  )
  if (type === 'FEATURES' || type === 'BENEFITS') {
    const items = (content.items as { icon?: string; title?: string; description?: string }[]) || []
    return (
      <>
        <SectionLabel>Content</SectionLabel>
        <CInput label="Heading" value={content.heading as string | undefined} set={(v) => set('heading', v)} />
        {type === 'FEATURES' && <CInput label="Subheading" value={content.subheading as string | undefined} set={(v) => set('subheading', v)} />}
        <div><Label className="text-xs font-medium text-foreground/80">Items</Label>
          <div className="space-y-2 mt-1">{items.map((it, i) => (
            <div key={i} className="rounded-lg border p-2.5 space-y-2">
              {type === 'FEATURES' && <Input className="h-8 text-sm" placeholder="Icon (emoji)" value={it.icon || ''} onChange={(e) => { const n = [...items]; n[i] = { ...it, icon: e.target.value }; set('items', n) }} />}
              <Input className="h-8 text-sm" placeholder="Title" value={it.title || ''} onChange={(e) => { const n = [...items]; n[i] = { ...it, title: e.target.value }; set('items', n) }} />
              <Textarea className="text-sm" rows={2} placeholder="Description" value={it.description || ''} onChange={(e) => { const n = [...items]; n[i] = { ...it, description: e.target.value }; set('items', n) }} />
            </div>
          ))}<Button size="sm" variant="outline" className="mt-1" onClick={() => set('items', [...items, { icon: '✨', title: '', description: '' }])}><Plus className="h-3 w-3 mr-1" />Add item</Button></div>
        </div>
      </>
    )
  }
  if (type === 'PRICING') {
    const plans = (content.plans as { name?: string; price?: number; interval?: string; features?: string[]; cta?: string; highlighted?: boolean }[]) || []
    return (
      <>
        <SectionLabel>Content</SectionLabel>
        <CInput label="Heading" value={content.heading as string | undefined} set={(v) => set('heading', v)} />
        <div><Label className="text-xs font-medium text-foreground/80">Plans</Label>
          <div className="space-y-2 mt-1">{plans.map((p, i) => (
            <div key={i} className="rounded-lg border p-2.5 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <Input className="h-8 text-sm" placeholder="Name" value={p.name || ''} onChange={(e) => { const n = [...plans]; n[i] = { ...p, name: e.target.value }; set('plans', n) }} />
                <Input type="number" className="h-8 text-sm" placeholder="$" value={p.price ?? 0} onChange={(e) => { const n = [...plans]; n[i] = { ...p, price: Number(e.target.value) }; set('plans', n) }} />
                <Input className="h-8 text-sm" placeholder="/mo" value={p.interval || ''} onChange={(e) => { const n = [...plans]; n[i] = { ...p, interval: e.target.value }; set('plans', n) }} />
              </div>
              <Input className="h-8 text-sm" placeholder="CTA" value={p.cta || ''} onChange={(e) => { const n = [...plans]; n[i] = { ...p, cta: e.target.value }; set('plans', n) }} />
              <Textarea className="text-sm" rows={2} placeholder="Features (one per line)" value={(p.features || []).join('\n')} onChange={(e) => { const n = [...plans]; n[i] = { ...p, features: e.target.value.split('\n') }; set('plans', n) }} />
            </div>
          ))}<Button size="sm" variant="outline" className="mt-1" onClick={() => set('plans', [...plans, { name: '', price: 0, interval: '/mo', features: [], cta: 'Get started', highlighted: false }])}><Plus className="h-3 w-3 mr-1" />Add plan</Button></div>
        </div>
      </>
    )
  }
  if (type === 'TESTIMONIALS' || type === 'FAQ') {
    const items = content.items as Record<string, string>[]
    const key1 = type === 'TESTIMONIALS' ? 'quote' : 'question'
    const key2 = type === 'TESTIMONIALS' ? 'name' : 'answer'
    const key3 = type === 'TESTIMONIALS' ? 'role' : ''
    return (
      <>
        <SectionLabel>Content</SectionLabel>
        <CInput label="Heading" value={content.heading as string | undefined} set={(v) => set('heading', v)} />
        <div><Label className="text-xs font-medium text-foreground/80">Items</Label>
          <div className="space-y-2 mt-1">{items?.map((it, i) => (
            <div key={i} className="rounded-lg border p-2.5 space-y-2">
              <Textarea className="text-sm" rows={2} placeholder={key1} value={it[key1] || ''} onChange={(e) => { const n = [...items]; n[i] = { ...it, [key1]: e.target.value }; set('items', n) }} />
              {key3 ? <div className="grid grid-cols-2 gap-2"><Input className="h-8 text-sm" placeholder="Name" value={it[key2] || ''} onChange={(e) => { const n = [...items]; n[i] = { ...it, [key2]: e.target.value }; set('items', n) }} /><Input className="h-8 text-sm" placeholder="Role" value={it[key3] || ''} onChange={(e) => { const n = [...items]; n[i] = { ...it, [key3]: e.target.value }; set('items', n) }} /></div>
                : <Input className="h-8 text-sm" placeholder="Answer" value={it[key2] || ''} onChange={(e) => { const n = [...items]; n[i] = { ...it, [key2]: e.target.value }; set('items', n) }} />}
            </div>
          ))}<Button size="sm" variant="outline" className="mt-1" onClick={() => set('items', [...(items || []), { [key1]: '', [key2]: '', ...(key3 ? { [key3]: '' } : {}) }])}><Plus className="h-3 w-3 mr-1" />Add item</Button></div>
        </div>
      </>
    )
  }
  return <p className="text-xs text-muted-foreground py-2">No editable fields for this section type.</p>
}

// ---------------------------------------------------------------------------
// Panel — header + Content / Style tabs
// ---------------------------------------------------------------------------

export function SectionSettingsPanel({ section, onUpdate }: { section: Section; onUpdate: (c: Record<string, unknown>) => void }) {
  const meta = SECTION_TYPES.find((t) => t.type === section.type)
  const Icon = meta?.icon || Layout
  const c = section.content
  const set: SetField = (path, value) => onUpdate(setPath(c, path, value))

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2"><Icon className="h-4 w-4 text-primary" />{meta?.name} settings</CardTitle>
        <Badge variant="secondary" className="text-[10px] font-medium">Section {section.position + 1}</Badge>
      </CardHeader>
      <CardContent className="space-y-0 max-h-[65vh] overflow-y-auto scroll-thin">
        <Tabs defaultValue="content">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="content" className="text-xs h-8">Content</TabsTrigger>
            <TabsTrigger value="style" className="text-xs h-8"><Palette className="h-3 w-3 mr-1" />Style</TabsTrigger>
          </TabsList>
          <TabsContent value="content" className="space-y-0">
            <SectionFields type={section.type} content={c} set={set} />
          </TabsContent>
          <TabsContent value="style" className="space-y-0">
            <SectionStyleFields content={c} set={set} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}