import { NextRequest, NextResponse } from 'next/server'
import { createRequestContext } from '@/lib/context'
import { db } from '@/lib/db'
import { logAuditEvent } from '@/lib/logging'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const ctx = await createRequestContext()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const original = await db.course.findFirst({
      where: { id, workspaceId: ctx.workspace.id },
      include: { sections: { include: { lessons: true }, orderBy: { position: 'asc' } } },
    })
    if (!original) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

    const copy = await db.course.create({
      data: {
        workspaceId: ctx.workspace.id,
        title: `${original.title} (Copy)`,
        description: original.description,
        thumbnailUrl: original.thumbnailUrl,
        category: original.category,
        price: original.price,
        level: original.level,
        status: 'DRAFT',
      },
    })

    for (const section of original.sections) {
      const newSection = await db.section.create({
        data: {
          courseId: copy.id,
          title: section.title,
          position: section.position,
        },
      })
      for (const lesson of section.lessons) {
        await db.lesson.create({
          data: {
            sectionId: newSection.id,
            title: lesson.title,
            type: lesson.type,
            duration: lesson.duration,
            isPreview: lesson.isPreview,
            content: lesson.content,
            position: lesson.position,
          },
        })
      }
    }

    await logAuditEvent('course.duplicate', {
      userId: ctx.user.id,
      workspaceId: ctx.workspace.id,
      resource: 'Course',
      resourceId: copy.id,
    })

    return NextResponse.json({ success: true, course: { id: copy.id, title: copy.title } })
  } catch (e) {
    if (e instanceof Error && e.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
