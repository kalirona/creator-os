import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { PublicPageView } from './view'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await db.page.findFirst({ where: { slug, status: 'PUBLISHED' } })
  if (!page) return { title: 'Page not found' }
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
    openGraph: {
      title: page.seoTitle || page.title,
      description: page.seoDescription || undefined,
      type: 'website',
    },
  }
}

export default async function PublicPage({ params }: Props) {
  const { slug } = await params
  const page = await db.page.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: { sections: { orderBy: { position: 'asc' } } },
  })
  if (!page) notFound()

  const sections = page.sections.map((s) => ({ ...s, content: JSON.parse(s.content || '{}') }))

  await db.page.update({ where: { id: page.id }, data: { visits: { increment: 1 } } }).catch(() => {})

  return <PublicPageView title={page.title} seoTitle={page.seoTitle} sections={sections} />
}
