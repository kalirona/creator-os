import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
export const dynamic = 'force-dynamic'

export async function GET() {
  const generations = await db.aiGeneration.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, toolSlug: true, title: true, status: true, creditsUsed: true, createdAt: true },
  })
  return NextResponse.json({ generations })
}
