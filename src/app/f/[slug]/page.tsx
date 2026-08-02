import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { PublicPageView } from '@/app/p/[slug]/view'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const funnel = await db.funnel.findFirst({ where: { slug } })
  if (!funnel || funnel.status !== 'LIVE') return { title: 'Page not found' }
  return {
    title: funnel.name,
    description: funnel.description || undefined,
    openGraph: { title: funnel.name, description: funnel.description || undefined, type: 'website' },
  }
}

export default async function PublicFunnel({ params }: Props) {
  const { slug } = await params
  const funnel = await db.funnel.findFirst({
    where: { slug },
    include: { steps: { orderBy: { position: 'asc' }, include: { page: { include: { sections: { orderBy: { position: 'asc' } } } } } } },
  })
  if (!funnel || funnel.status !== 'LIVE') notFound()

  await db.funnel.update({ where: { id: funnel.id }, data: { visits: { increment: 1 } } }).catch(() => {})

  const firstStep = funnel.steps.find((s) => s.page) || funnel.steps[0]
  if (!firstStep?.page) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-xl font-bold">{funnel.name}</h1>
          <p className="text-sm text-muted-foreground mt-2">This funnel is live but has no landing page yet.</p>
        </div>
      </main>
    )
  }

  const page = firstStep.page
  const sections = page.sections.map((s) => ({ ...s, content: JSON.parse(s.content || '{}') }))

  await db.page.update({ where: { id: page.id }, data: { visits: { increment: 1 } } }).catch(() => {})

  return <PublicPageView title={page.title} seoTitle={page.seoTitle} sections={sections} />
}
