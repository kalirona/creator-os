import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createRequestContext } from '@/lib/context'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const ctx = await createRequestContext()
  if (ctx.user.role !== 'ADMIN' && ctx.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function GET() {
  const authError = await requireAdmin()
  if (authError) return authError

  const generations = await db.aiGeneration.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, toolSlug: true, title: true, status: true, creditsUsed: true, createdAt: true },
  })
  return NextResponse.json({ generations })
}
