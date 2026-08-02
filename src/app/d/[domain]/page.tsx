import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { PublicPageView } from '@/app/p/[slug]/view'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Props {
  params: Promise<{ domain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain } = await params
  const host = decodeURIComponent(domain)
  const cd = await db.customDomain.findUnique({ where: { domain: host }, include: { funnel: true } })
  if (!cd || !cd.funnel) return { title: 'Page not found' }
  return {
    title: cd.funnel.name,
    description: cd.funnel.description || undefined,
    openGraph: { title: cd.funnel.name, description: cd.funnel.description || undefined, type: 'website' },
  }
}

export default async function CustomDomainPage({ params }: Props) {
  const { domain } = await params
  const host = decodeURIComponent(domain)

  const cd = await db.customDomain.findUnique({
    where: { domain: host },
    include: { funnel: { include: { steps: { orderBy: { position: 'asc' }, include: { page: { include: { sections: { orderBy: { position: 'asc' } } } } } } } } },
  })
  if (!cd) notFound()

  // Not yet verified -> show a verification placeholder
  if (cd.status !== 'VERIFIED' && cd.status !== 'ACTIVE') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold">Almost there!</h1>
          <p className="text-sm text-muted-foreground mt-2">
            This domain is connected but not yet verified. If you own this domain, check your CreatorOS dashboard to finish setup.
          </p>
        </div>
      </main>
    )
  }

  const funnel = cd.funnel
  if (!funnel || funnel.status !== 'LIVE') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-xl font-bold">{funnel?.name || 'This funnel is not live'}</h1>
          <p className="text-sm text-muted-foreground mt-2">This page is not available right now.</p>
        </div>
      </main>
    )
  }

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
