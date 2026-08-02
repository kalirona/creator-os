'use client'

import { SectionRenderer } from '@/components/page-builder/SectionRenderer'

interface SectionView {
  id: string
  type: string
  content: Record<string, unknown>
}

export function PublicPageView({ title, seoTitle, sections }: {
  title: string
  seoTitle: string
  sections: SectionView[]
}) {
  return (
    <main className="min-h-screen bg-background">
      {sections.length === 0 ? (
        <div className="flex min-h-screen items-center justify-center text-muted-foreground text-sm">
          <span>{title || seoTitle || 'This page is empty'}</span>
        </div>
      ) : (
        sections.map((s) => (
          <SectionRenderer key={s.id} type={s.type} content={s.content} />
        ))
      )}
    </main>
  )
}
