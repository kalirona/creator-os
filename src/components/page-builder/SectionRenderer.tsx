'use client'

import { cn } from '@/lib/utils'

// ============================================================================
// Live section renderer — renders every section type the way a visitor sees it.
// Used inside the page editor canvas as a live preview.
// ============================================================================

interface RenderProps {
  content: Record<string, unknown>
  selected?: boolean
  onClick?: () => void
}

export function SectionRenderer({ type, content, selected, onClick }: {
  type: string
  content: Record<string, unknown>
  selected?: boolean
  onClick?: () => void
}) {
  const wrapperClass = cn(
    'group/section relative w-full transition-shadow',
    selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg',
    onClick && 'cursor-pointer',
  )

  const render = () => {
    switch (type) {
      case 'HERO': return <HeroSection content={content} />
      case 'HEADING': return <HeadingSection content={content} />
      case 'TEXT': return <TextSection content={content} />
      case 'FEATURES': return <FeaturesSection content={content} />
      case 'BENEFITS': return <BenefitsSection content={content} />
      case 'PRICING': return <PricingSection content={content} />
      case 'TESTIMONIALS': return <TestimonialsSection content={content} />
      case 'FAQ': return <FaqSection content={content} />
      case 'VIDEO': return <VideoSection content={content} />
      case 'GALLERY': return <GallerySection content={content} />
      case 'COUNTDOWN': return <CountdownSection content={content} />
      case 'CTA': return <CtaSection content={content} />
      case 'NEWSLETTER': return <NewsletterSection content={content} />
      case 'FOOTER': return <FooterSection content={content} />
      default: return <TextSection content={content} />
    }
  }

  return (
    <div className={wrapperClass} onClick={onClick}>
      {render()}
    </div>
  )
}

// ---------- HERO ----------
function HeroSection({ content }: RenderProps) {
  const c = content as { emoji?: string; headline?: string; subheadline?: string; ctaText?: string; ctaSecondary?: string }
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background px-6 py-16 md:py-20 text-center">
      {c.emoji && <div className="mb-4 text-5xl">{c.emoji}</div>}
      {c.headline && <h1 className="mx-auto max-w-3xl text-3xl md:text-4xl font-bold tracking-tight">{c.headline}</h1>}
      {c.subheadline && <p className="mx-auto mt-4 max-w-2xl text-sm md:text-base text-muted-foreground">{c.subheadline}</p>}
      {(c.ctaText || c.ctaSecondary) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {c.ctaText && <span className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20">{c.ctaText}</span>}
          {c.ctaSecondary && <span className="rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium">{c.ctaSecondary}</span>}
        </div>
      )}
    </section>
  )
}

// ---------- HEADING ----------
function HeadingSection({ content }: RenderProps) {
  const c = content as { text?: string; alignment?: string }
  const align = c.alignment || 'center'
  return (
    <section className="px-6 py-10">
      <h2 className={cn('text-2xl md:text-3xl font-bold tracking-tight', align === 'center' && 'text-center', align === 'right' && 'text-right')}>
        {c.text || 'Section heading'}
      </h2>
    </section>
  )
}

// ---------- TEXT ----------
function TextSection({ content }: RenderProps) {
  const c = content as { text?: string }
  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-3xl space-y-4 text-sm md:text-base leading-relaxed text-muted-foreground whitespace-pre-line">
        {c.text || 'Write your paragraph here.'}
      </div>
    </section>
  )
}

// ---------- FEATURES ----------
function FeaturesSection({ content }: RenderProps) {
  const c = content as { heading?: string; subheading?: string; items?: { icon?: string; title?: string; description?: string }[] }
  const items = c.items || []
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-5xl">
        {c.heading && <h2 className="text-center text-2xl md:text-3xl font-bold">{c.heading}</h2>}
        {c.subheading && <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">{c.subheading}</p>}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f, i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              {f.icon && <div className="mb-3 text-2xl">{f.icon}</div>}
              <p className="font-semibold text-sm">{f.title}</p>
              {f.description && <p className="mt-1 text-xs text-muted-foreground">{f.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------- BENEFITS ----------
function BenefitsSection({ content }: RenderProps) {
  const c = content as { heading?: string; items?: { title?: string; description?: string }[] }
  const items = c.items || []
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-4xl">
        {c.heading && <h2 className="text-center text-2xl md:text-3xl font-bold">{c.heading}</h2>}
        <div className="mt-8 space-y-4">
          {items.map((b, i) => (
            <div key={i} className="flex gap-4 rounded-xl border bg-card p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">{i + 1}</span>
              <div>
                <p className="font-semibold text-sm">{b.title}</p>
                {b.description && <p className="mt-1 text-xs text-muted-foreground">{b.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------- PRICING ----------
function PricingSection({ content }: RenderProps) {
  const c = content as { heading?: string; plans?: { name?: string; price?: number; interval?: string; features?: string[]; cta?: string; highlighted?: boolean }[] }
  const plans = c.plans || []
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-5xl">
        {c.heading && <h2 className="text-center text-2xl md:text-3xl font-bold">{c.heading}</h2>}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {plans.map((p, i) => (
            <div key={i} className={cn('rounded-xl border p-6', p.highlighted && 'border-primary bg-primary/5 shadow-lg shadow-primary/10')}>
              {p.highlighted && <span className="mb-3 inline-block rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground">Most Popular</span>}
              <p className="font-semibold">{p.name}</p>
              <p className="mt-2 text-3xl font-bold">${p.price}<span className="text-sm font-normal text-muted-foreground"> {p.interval}</span></p>
              {p.features && (
                <ul className="mt-4 space-y-1.5">
                  {p.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="mt-0.5 text-emerald-500">✓</span>{f}
                    </li>
                  ))}
                </ul>
              )}
              {p.cta && (
                <div className={cn('mt-5 rounded-lg py-2 text-center text-sm font-medium', p.highlighted ? 'bg-primary text-primary-foreground' : 'border border-border')}>
                  {p.cta}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------- TESTIMONIALS ----------
function TestimonialsSection({ content }: RenderProps) {
  const c = content as { heading?: string; items?: { name?: string; role?: string; quote?: string }[] }
  const items = c.items || []
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-5xl">
        {c.heading && <h2 className="text-center text-2xl md:text-3xl font-bold">{c.heading}</h2>}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map((t, i) => (
            <div key={i} className="flex flex-col rounded-xl border bg-card p-5">
              <div className="mb-2 text-amber-400">★★★★★</div>
              <p className="flex-1 text-sm italic text-muted-foreground">"{t.quote}"</p>
              <p className="mt-3 text-sm font-semibold">{t.name}</p>
              {t.role && <p className="text-xs text-muted-foreground">{t.role}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------- FAQ ----------
function FaqSection({ content }: RenderProps) {
  const c = content as { heading?: string; items?: { question?: string; answer?: string }[] }
  const items = c.items || []
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-3xl">
        {c.heading && <h2 className="text-center text-2xl md:text-3xl font-bold">{c.heading}</h2>}
        <div className="mt-8 space-y-2">
          {items.map((f, i) => (
            <div key={i} className="rounded-xl border bg-card">
              <div className="p-4 text-sm font-semibold">{f.question}</div>
              {f.answer && <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed">{f.answer}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------- VIDEO ----------
function VideoSection({ content }: RenderProps) {
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
        {c.heading && <h2 className="text-center text-2xl md:text-3xl font-bold">{c.heading}</h2>}
        <div className="mt-6 overflow-hidden rounded-xl border bg-card aspect-video">
          {c.videoUrl ? (
            <iframe src={embed(c.videoUrl) || undefined} className="h-full w-full" title="Video" frameBorder="0" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Add a video URL</div>
          )}
        </div>
        {c.description && <p className="mt-3 text-center text-xs text-muted-foreground">{c.description}</p>}
      </div>
    </section>
  )
}

// ---------- GALLERY ----------
function GallerySection({ content }: RenderProps) {
  const c = content as { heading?: string; images?: string[] }
  const images = c.images || []
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-5xl">
        {c.heading && <h2 className="text-center text-2xl md:text-3xl font-bold">{c.heading}</h2>}
        {images.length === 0 ? (
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
function CountdownSection({ content }: RenderProps) {
  const c = content as { heading?: string; endDate?: string; ctaText?: string }
  return (
    <section className="bg-gradient-to-br from-primary/15 to-background px-6 py-14 text-center">
      {c.heading && <h2 className="text-2xl md:text-3xl font-bold">{c.heading}</h2>}
      <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-3">
        {['3', '2', '1'].map((n, i) => (
          <div key={i} className="flex h-16 w-16 flex-col items-center justify-center rounded-xl border bg-background shadow-lg">
            <span className="text-2xl font-bold tabular-nums">{n}0</span>
            <span className="text-[10px] text-muted-foreground">days</span>
          </div>
        ))}
      </div>
      {c.ctaText && <div className="mx-auto mt-6 w-fit rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20">{c.ctaText}</div>}
    </section>
  )
}

// ---------- CTA ----------
function CtaSection({ content }: RenderProps) {
  const c = content as { headline?: string; subtext?: string; ctaText?: string }
  return (
    <section className="px-6 py-16 text-center">
      {c.headline && <h2 className="mx-auto max-w-2xl text-2xl md:text-3xl font-bold">{c.headline}</h2>}
      {c.subtext && <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">{c.subtext}</p>}
      {c.ctaText && <div className="mx-auto mt-6 w-fit rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20">{c.ctaText}</div>}
    </section>
  )
}

// ---------- NEWSLETTER ----------
function NewsletterSection({ content }: RenderProps) {
  const c = content as { heading?: string; subtext?: string; placeholder?: string; ctaText?: string }
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center shadow-sm">
        {c.heading && <h3 className="text-xl font-bold">{c.heading}</h3>}
        {c.subtext && <p className="mt-2 text-sm text-muted-foreground">{c.subtext}</p>}
        <div className="mt-5 flex gap-2">
          <span className="flex-1 rounded-lg border bg-background px-3 py-2 text-left text-sm text-muted-foreground">{c.placeholder || 'you@email.com'}</span>
          <span className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">{c.ctaText || 'Subscribe'}</span>
        </div>
      </div>
    </section>
  )
}

// ---------- FOOTER ----------
function FooterSection({ content }: RenderProps) {
  const c = content as { brand?: string; tagline?: string; links?: { label?: string; url?: string }[] }
  const links = c.links || []
  return (
    <footer className="border-t bg-card px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
        <div>
          <p className="font-semibold">{c.brand || 'CreatorOS'}</p>
          {c.tagline && <p className="mt-1 text-xs text-muted-foreground">{c.tagline}</p>}
        </div>
        {links.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-4">
            {links.map((l, i) => (
              <span key={i} className="text-xs text-muted-foreground">{l.label}</span>
            ))}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">© {new Date().getFullYear()} {c.brand || 'CreatorOS'}</p>
      </div>
    </footer>
  )
}
