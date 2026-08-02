import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { courseService } from '@/lib/services'
import type { CurriculumSection } from '@/lib/services/courses'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const body = await req.json()
    const { courseId, sections } = body as { courseId?: string; sections?: CurriculumSection[] }
    if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
    if (!Array.isArray(sections)) return NextResponse.json({ error: 'sections must be an array' }, { status: 400 })

    const result = await courseService.saveCurriculum(ctx, courseId, sections)
    return NextResponse.json({ success: true, sections: result.sections })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
