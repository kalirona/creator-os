import { NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { dashboardService } from '@/lib/services'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const ctx = await createRequestContext()
    const stats = await dashboardService.getStats(ctx)
    return NextResponse.json(stats)
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
