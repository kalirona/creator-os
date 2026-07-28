import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function GET() {
  const posts = await db.blogPost.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({
    posts: posts.map((p) => ({ id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt, category: p.category, tags: p.tags.split(',').filter(Boolean), author: p.author, status: p.status, visits: p.visits, publishedAt: p.publishedAt, createdAt: p.createdAt })),
    stats: { total: posts.length, published: posts.filter((p) => p.status === 'PUBLISHED').length, drafts: posts.filter((p) => p.status === 'DRAFT').length, totalVisits: posts.reduce((s, p) => s + p.visits, 0) },
  })
}
