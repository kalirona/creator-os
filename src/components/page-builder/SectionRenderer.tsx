'use client'

import { createElement } from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// Live section renderer — renders every section type the way a visitor sees it.
// Used inside the page editor canvas as a live preview.
//
// When `editing` is enabled, text fields become `contentEditable` so users can
// click-and-type directly on the canvas (craft.js-style hover-to-edit). Values
// are committed on blur via `onFieldChange(path, value)` using dot paths, e.g.
// `items.0.title`.
// ============================================================================

interface RenderProps {
  content: Record<string, unknown>
  selected?: boolean
  onClick?: () => void
}

function EditableText({
  value,
  editing,
  onCommit,
  className,
  multiline,
  as = 'div',
}: {
  value?: string | number | null
  editing?: boolean
  onCommit?: (v: string) => void
  className?: string
  multiline?: boolean
  as?: keyof React.JSX.IntrinsicElements
}) {
  if (!editing) {
    return createElement(as, { className }, value === undefined || value === null ? '' : String(value))
  }

  const text = value === undefined || value === null ? '' : String(value)
  const Tag = as as React.ElementType

  const handleBlur = (e: React.FocusEvent) => {
    const v = (e.target as HTMLElement).innerText
    if (v !== text) onCommit?.(v)
  }

  return (
    <Tag
      className={cn(className, 'outline-none rounded-sm cursor-text transition focus:ring-2 focus:ring-primary/40 focus:ring-inset')}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault()
          ;(e.target as HTMLElement).blur()
        }
        if (e.key === 'Escape') {
          e.preventDefault()
          ;(e.target as HTMLElement).blur()
        }
      }}
      onBlur={handleBlur}
    >
      {text}
    </Tag>
  )
}

function editableField(path: string, content: Record<string, unknown>, editing?: boolean, onFieldChange?: (path: string, value: string) => void) {
  const value = content[path] as string | undefined
  return {
    value,
    editing: !!editing,
    onCommit: (v: string) => onFieldChange?.(path, v),
  }
}

export function SectionRenderer({ type, content, selected, onClick, editing, onFieldChange }: {
  type: string
  content: Record<string, unknown>
  selected?: boolean
  onClick?: () => void
  editing?: boolean
  onFieldChange?: (path: string, value: string) => void
}) {
  const wrapperClass = cn(
    'group/section relative w-full transition-shadow',
    selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg',
    onClick && 'cursor-pointer',
  )

  const render = () => {
    switch (type) {
      case 'HERO': return <HeroSection content={content} editing={editing} onFieldChange={onFieldChange} />
      case 'HEADING': return <HeadingSection content={content} editing={editing} onFieldChange={onFieldChange} />
      case 'TEXT': return <TextSection content={content} editing={editing} onFieldChange={onFieldChange} />
      case 'FEATURES': return <FeaturesSection content={content} editing={editing} onFieldChange={onFieldChange} />
      case 'BENEFITS': return <BenefitsSection content={content} editing={editing} onFieldChange={onFieldChange} />
      case 'PRICING': return <PricingSection content={content} editing={editing} onFieldChange={onFieldChange} />
      case 'TESTIMONIALS': return <TestimonialsSection content={content} editing={editing} onFieldChange={onFieldChange} />
      case 'FAQ': return <FaqSection content={content} editing={editing} onFieldChange={onFieldChange} />
      case 'VIDEO': return <VideoSection content={content} editing={editing} onFieldChange={onFieldChange} />
      case 'GALLERY': return <GallerySection content={content} editing={editing} onFieldChange={onFieldChange} />
      case 'COUNTDOWN': return <CountdownSection content={content} editing={editing} onFieldChange={onFieldChange} />
      case 'CTA': return <CtaSection content={content} editing={editing} onFieldChange={onFieldChange} />
      case 'NEWSLETTER': return <NewsletterSection content={content} editing={editing} onFieldChange={onFieldChange} />
      case 'FOOTER': return <FooterSection content={content} editing={editing} onFieldChange={onFieldChange} />
      default: return <TextSection content={content} editing={editing} onFieldChange={onFieldChange} />
    }
  }

  return (
    <div className={wrapperClass} onClick={onClick}>
      {render()}
    </div>
  )
}

// ---------- HERO ----------
function HeroSection({ content, editing, onFieldChange }: RenderProps & { editing?: boolean; onFieldChange?: (path: string, value: string) => void }) {
  const c = content as { emoji?: string; headline?: string; subheadline?: string; ctaText?: string; ctaSecondary?: string }
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background px-6 py-16 md:py-20 text-center">
      {c.emoji ? (
        <EditableText {...editableField('emoji', content, editing, onFieldChange)} className="mb-4 text-5xl" />
      ) : editing ? (
        <EditableText {...editableField('emoji', content, editing, onFieldChange)} className="mb-4 text-5xl min-h-12" />
      ) : null}
      {c.headline ? (
        <EditableText {...editableField('headline', content, editing, onFieldChange)} as="h1" className="mx-auto max-w-3xl text-3xl md:text-4xl font-bold tracking-tight" />
      ) : editing ? (
        <EditableText {...editableField('headline', content, editing, onFieldChange)} as="h1" className="mx-auto max-w-3xl text-3xl md:text-4xl font-bold tracking-tight" />
      ) : null}
      {c.subheadline || editing ? (
        <EditableText {...editableField('subheadline', content, editing, onFieldChange)} multiline className="mx-auto mt-4 max-w-2xl text-sm md:text-base text-muted-foreground" />
      ) : null}
      {(c.ctaText || c.ctaSecondary || editing) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {c.ctaText || editing ? (
            <EditableText {...editableField('ctaText', content, editing, onFieldChange)} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 min-w-16" />
          ) : null}
          {c.ctaSecondary || editing ? (
            <EditableText {...editableField('ctaSecondary', content, editing, onFieldChange)} className="rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium min-w-16" />
          ) : null}
        </div>
      )}
    </section>
  )
}

// ---------- HEADING ----------
function HeadingSection({ content, editing, onFieldChange }: RenderProps & { editing?: boolean; onFieldChange?: (path: string, value: string) => void }) {
  const c = content as { text?: string; alignment?: string }
  const align = c.alignment || 'center'
  return (
    <section className="px-6 py-10">
      <EditableText
        {...editableField('text', content, editing, onFieldChange)}
        as="h2"
        className={cn('text-2xl md:text-3xl font-bold tracking-tight', align === 'center' && 'text-center', align === 'right' && 'text-right')}
      />
    </section>
  )
}

// ---------- TEXT ----------
function TextSection({ content, editing, onFieldChange }: RenderProps & { editing?: boolean; onFieldChange?: (path: string, value: string) => void }) {
  const c = content as { text?: string }
  return (
    <section className="px-6 py-8">
      <EditableText
        {...editableField('text', content, editing, onFieldChange)}
        multiline
        className="mx-auto max-w-3xl space-y-4 text-sm md:text-base leading-relaxed text-muted-foreground whitespace-pre-line"
      />
    </section>
  )
}

// ---------- FEATURES ----------
function FeaturesSection({ content, editing, onFieldChange }: RenderProps & { editing?: boolean; onFieldChange?: (path: string, value: string) => void }) {
  const c = content as { heading?: string; subheading?: string; items?: { icon?: string; title?: string; description?: string }[] }
  const items = c.items || []
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-5xl">
        {c.heading || editing ? (
          <EditableText {...editableField('heading', content, editing, onFieldChange)} as="h2" className="text-center text-2xl md:text-3xl font-bold" />
        ) : null}
        {c.subheading || editing ? (
          <EditableText {...editableField('subheading', content, editing, onFieldChange)} multiline className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground" />
        ) : null}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f, i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              {f.icon || editing ? (
                <EditableText {...editableField(`items.${i}.icon`, content, editing, onFieldChange)} className="mb-3 text-2xl min-h-6" />
              ) : null}
              <EditableText {...editableField(`items.${i}.title`, content, editing, onFieldChange)} as="p" className="font-semibold text-sm" />
              {f.description || editing ? (
                <EditableText {...editableField(`items.${i}.description`, content, editing, onFieldChange)} multiline className="mt-1 text-xs text-muted-foreground" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------- BENEFITS ----------
function BenefitsSection({ content, editing, onFieldChange }: RenderProps & { editing?: boolean; onFieldChange?: (path: string, value: string) => void }) {
  const c = content as { heading?: string; items?: { title?: string; description?: string }[] }
  const items = c.items || []
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-4xl">
        {c.heading || editing ? (
          <EditableText {...editableField('heading', content, editing, onFieldChange)} as="h2" className="text-center text-2xl md:text-3xl font-bold" />
        ) : null}
        <div className="mt-8 space-y-4">
          {items.map((b, i) => (
            <div key={i} className="flex gap-4 rounded-xl border bg-card p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">{i + 1}</span>
              <div>
                <EditableText {...editableField(`items.${i}.title`, content, editing, onFieldChange)} as="p" className="font-semibold text-sm" />
                {b.description || editing ? (
                  <EditableText {...editableField(`items.${i}.description`, content, editing, onFieldChange)} multiline className="mt-1 text-xs text-muted-foreground" />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------- PRICING ----------
function PricingSection({ content, editing, onFieldChange }: RenderProps & { editing?: boolean; onFieldChange?: (path: string, value: string) => void }) {
  const c = content as { heading?: string; plans?: { name?: string; price?: number; interval?: string; features?: string[]; cta?: string; highlighted?: boolean }[] }
  const plans = c.plans || []
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-5xl">
        {c.heading || editing ? (
          <EditableText {...editableField('heading', content, editing, onFieldChange)} as="h2" className="text-center text-2xl md:text-3xl font-bold" />
        ) : null}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {plans.map((p, i) => (
            <div key={i} className={cn('rounded-xl border p-6', p.highlighted && 'border-primary bg-primary/5 shadow-lg shadow-primary/10')}>
              {p.highlighted && <span className="mb-3 inline-block rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground">Most Popular</span>}
              <EditableText {...editableField(`plans.${i}.name`, content, editing, onFieldChange)} as="p" className="font-semibold" />
              <p className="mt-2 text-3xl font-bold">
                <EditableText {...editableField(`plans.${i}.price`, content, editing, onFieldChange)} className="inline-block" />
                {p.interval || editing ? (
                  <EditableText {...editableField(`plans.${i}.interval`, content, editing, onFieldChange)} className="text-sm font-normal text-muted-foreground" />
                ) : null}
              </p>
              {p.features && (
                <ul className="mt-4 space-y-1.5">
                  {p.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="mt-0.5 text-emerald-500">✓</span>
                      <EditableText {...editableField(`plans.${i}.features.${fi}`, content, editing, onFieldChange)} className="flex-1" />
                    </li>
                  ))}
                </ul>
              )}
              {p.cta || editing ? (
                <EditableText {...editableField(`plans.${i}.cta`, content, editing, onFieldChange)} className={cn('mt-5 rounded-lg py-2 text-center text-sm font-medium', p.highlighted ? 'bg-primary text-primary-foreground' : 'border border-border')} />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------- TESTIMONIALS ----------
function TestimonialsSection({ content, editing, onFieldChange }: RenderProps & { editing?: boolean; onFieldChange?: (path: string, value: string) => void }) {
  const c = content as { heading?: string; items?: { name?: string; role?: string; quote?: string }[] }
  const items = c.items || []
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-5xl">
        {c.heading || editing ? (
          <EditableText {...editableField('heading', content, editing, onFieldChange)} as="h2" className="text-center text-2xl md:text-3xl font-bold" />
        ) : null}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map((t, i) => (
            <div key={i} className="flex flex-col rounded-xl border bg-card p-5">
              <div className="mb-2 text-amber-400">★★★★★</div>
              <EditableText {...editableField(`items.${i}.quote`, content, editing, onFieldChange)} multiline className="flex-1 text-sm italic text-muted-foreground" />
              <EditableText {...editableField(`items.${i}.name`, content, editing, onFieldChange)} as="p" className="mt-3 text-sm font-semibold" />
              {t.role || editing ? (
                <EditableText {...editableField(`items.${i}.role`, content, editing, onFieldChange)} className="text-xs text-muted-foreground" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------- FAQ ----------
function FaqSection({ content, editing, onFieldChange }: RenderProps & { editing?: boolean; onFieldChange?: (path: string, value: string) => void }) {
  const c = content as { heading?: string; items?: { question?: string; answer?: string }[] }
  const items = c.items || []
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-3xl">
        {c.heading || editing ? (
          <EditableText {...editableField('heading', content, editing, onFieldChange)} as="h2" className="text-center text-2xl md:text-3xl font-bold" />
        ) : null}
        <div className="mt-8 space-y-2">
          {items.map((f, i) => (
            <div key={i} className="rounded-xl border bg-card">
              <EditableText {...editableField(`items.${i}.question`, content, editing, onFieldChange)} as="div" className="p-4 text-sm font-semibold" />
              {f.answer || editing ? (
                <EditableText {...editableField(`items.${i}.answer`, content, editing, onFieldChange)} multiline className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------- VIDEO ----------
function VideoSection({ content, editing, onFieldChange }: RenderProps & { editing?: boolean; onFieldChange?: (path: string, value: string) => void }) {
  const c = content as { heading?: string; videoUrl?: string; description?: string }
  const embed = (url?: string) => {
    if (!url) return null
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`
    return url
  }
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-3xl">
        {c.heading || editing ? (
          <EditableText {...editableField('heading', content, editing, onFieldChange)} as="h2" className="text-center text-2xl md:text-3xl font-bold" />
        ) : null}
        <div className="mt-6 overflow-hidden rounded-xl border bg-card aspect-video">
          {c.videoUrl ? (
            <iframe src={embed(c.videoUrl) || undefined} className="h-full w-full" title="Video" frameBorder="0" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Add a video URL</div>
          )}
        </div>
        {c.description || editing ? (
          <EditableText {...editableField('description', content, editing, onFieldChange)} multiline className="mt-3 text-center text-xs text-muted-foreground" />
        ) : null}
      </div>
    </section>
  )
}

// ---------- GALLERY ----------
function GallerySection({ content, editing, onFieldChange }: RenderProps & { editing?: boolean; onFieldChange?: (path: string, value: string) => void }) {
  const c = content as { heading?: string; images?: string[] }
  const images = c.images || []
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-5xl">
        {c.heading || editing ? (
          <EditableText {...editableField('heading', content, editing, onFieldChange)} as="h2" className="text-center text-2xl md:text-3xl font-bold" />
        ) : null}
        {images.length === 0 && !editing ? (
          <p className="mt-6 text-center text-xs text-muted-foreground">Add images to show a gallery</p>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((src, i) => (
              <div key={i} className="aspect-video overflow-hidden rounded-xl border bg-muted">
                <img src={src} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ---------- COUNTDOWN ----------
function CountdownSection({ content, editing, onFieldChange }: RenderProps & { editing?: boolean; onFieldChange?: (path: string, value: string) => void }) {
  const c = content as { heading?: string; endDate?: string; ctaText?: string }
  return (
    <section className="bg-gradient-to-br from-primary/15 to-background px-6 py-14 text-center">
      {c.heading || editing ? (
        <EditableText {...editableField('heading', content, editing, onFieldChange)} as="h2" className="text-2xl md:text-3xl font-bold" />
      ) : null}
      <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-3">
        {['3', '2', '1'].map((n, i) => (
          <div key={i} className="flex h-16 w-16 flex-col items-center justify-center rounded-xl border bg-background shadow-lg">
            <span className="text-2xl font-bold tabular-nums">{n}0</span>
            <span className="text-[10px] text-muted-foreground">days</span>
          </div>
        ))}
      </div>
      {c.ctaText || editing ? (
        <EditableText {...editableField('ctaText', content, editing, onFieldChange)} className="mx-auto mt-6 w-fit rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 min-w-16" />
      ) : null}
    </section>
  )
}

// ---------- CTA ----------
function CtaSection({ content, editing, onFieldChange }: RenderProps & { editing?: boolean; onFieldChange?: (path: string, value: string) => void }) {
  const c = content as { headline?: string; subtext?: string; ctaText?: string }
  return (
    <section className="px-6 py-16 text-center">
      {c.headline || editing ? (
        <EditableText {...editableField('headline', content, editing, onFieldChange)} as="h2" className="mx-auto max-w-2xl text-2xl md:text-3xl font-bold" />
      ) : null}
      {c.subtext || editing ? (
        <EditableText {...editableField('subtext', content, editing, onFieldChange)} multiline className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground" />
      ) : null}
      {c.ctaText || editing ? (
        <EditableText {...editableField('ctaText', content, editing, onFieldChange)} className="mx-auto mt-6 w-fit rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 min-w-16" />
      ) : null}
    </section>
  )
}

// ---------- NEWSLETTER ----------
function NewsletterSection({ content, editing, onFieldChange }: RenderProps & { editing?: boolean; onFieldChange?: (path: string, value: string) => void }) {
  const c = content as { heading?: string; subtext?: string; placeholder?: string; ctaText?: string }
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center shadow-sm">
        {c.heading || editing ? (
          <EditableText {...editableField('heading', content, editing, onFieldChange)} as="h3" className="text-xl font-bold" />
        ) : null}
        {c.subtext || editing ? (
          <EditableText {...editableField('subtext', content, editing, onFieldChange)} multiline className="mt-2 text-sm text-muted-foreground" />
        ) : null}
        <div className="mt-5 flex gap-2">
          <EditableText {...editableField('placeholder', content, editing, onFieldChange)} className="flex-1 rounded-lg border bg-background px-3 py-2 text-left text-sm text-muted-foreground" />
          <EditableText {...editableField('ctaText', content, editing, onFieldChange)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" />
        </div>
      </div>
    </section>
  )
}

// ---------- FOOTER ----------
function FooterSection({ content, editing, onFieldChange }: RenderProps & { editing?: boolean; onFieldChange?: (path: string, value: string) => void }) {
  const c = content as { brand?: string; tagline?: string; links?: { label?: string; url?: string }[] }
  const links = c.links || []
  return (
    <footer className="border-t bg-card px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
        <div>
          <EditableText {...editableField('brand', content, editing, onFieldChange)} as="p" className="font-semibold" />
          {c.tagline || editing ? (
            <EditableText {...editableField('tagline', content, editing, onFieldChange)} multiline className="mt-1 text-xs text-muted-foreground" />
          ) : null}
        </div>
        {links.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-4">
            {links.map((l, i) => (
              <EditableText {...editableField(`links.${i}.label`, content, editing, onFieldChange)} key={i} className="text-xs text-muted-foreground" />
            ))}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">© {new Date().getFullYear()} {c.brand || 'CreatorOS'}</p>
      </div>
    </footer>
  )
}
