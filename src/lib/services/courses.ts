import { db } from '@/lib/db'
import { logAuditEvent, logActivity } from '@/lib/logging'
import { type RequestContext, requirePermission } from '@/lib/context'

export interface CurriculumSection {
  id?: string
  title: string
  position: number
  lessons?: {
    id?: string
    title: string
    type?: string
    duration?: number
    isPreview?: boolean
    content?: string
    position: number
  }[]
}

export class CourseService {
  async list(ctx: RequestContext) {
    await requirePermission(ctx, 'course', 'read')
    const courses = await db.course.findMany({
      where: { workspaceId: ctx.workspace.id },
      orderBy: { createdAt: 'desc' },
      include: { sections: { include: { lessons: true }, orderBy: { position: 'asc' } } },
    })

    return courses.map((c) => ({
      id: c.id, title: c.title, description: c.description, category: c.category,
      price: c.price, level: c.level, rating: c.rating, studentsCount: c.studentsCount,
      status: c.status, thumbnailUrl: c.thumbnailUrl,
      sections: c.sections.map((s) => ({
        id: s.id, title: s.title, position: s.position,
        lessons: s.lessons.map((l) => ({ id: l.id, title: l.title, type: l.type, duration: l.duration, isPreview: l.isPreview, content: l.content })),
      })),
      totalLessons: c.sections.reduce((acc, s) => acc + s.lessons.length, 0),
      totalDuration: c.sections.reduce((acc, s) => acc + s.lessons.reduce((a, l) => a + l.duration, 0), 0),
    }))
  }

  async create(ctx: RequestContext, data: {
    title: string
    description?: string
    category?: string
    level?: string
    price?: number | string
  }) {
    await requirePermission(ctx, 'course', 'create')

    if (!data.title || !data.title.trim()) {
      throw new Error('Course title is required')
    }

    const course = await db.course.create({
      data: {
        workspaceId: ctx.workspace.id,
        title: data.title.trim(),
        description: data.description || '',
        category: data.category || 'Marketing',
        level: data.level || 'BEGINNER',
        price: parseFloat(String(data.price)) || 0,
        status: 'DRAFT',
      },
    })

    await logAuditEvent('course.create', {
      userId: ctx.user.id,
      workspaceId: ctx.workspace.id,
      resource: 'Course',
      resourceId: course.id,
      metadata: { title: course.title },
    })

    await logActivity('started_editing', {
      userId: ctx.user.id,
      workspaceId: ctx.workspace.id,
      description: `Created course "${course.title}"`,
      metadata: { courseId: course.id },
    })

    return { id: course.id, title: course.title, status: course.status }
  }

  async update(ctx: RequestContext, id: string, data: Record<string, unknown>) {
    await requirePermission(ctx, 'course', 'update')

    const existing = await db.course.findFirst({
      where: { id, workspaceId: ctx.workspace.id },
    })
    if (!existing) throw new Error('Course not found')

    // Convert price to float if present
    const updateData = { ...data }
    if (updateData.price !== undefined) {
      updateData.price = parseFloat(String(updateData.price)) || 0
    }

    const course = await db.course.update({ where: { id }, data: updateData })

    await logAuditEvent('course.update', {
      userId: ctx.user.id,
      workspaceId: ctx.workspace.id,
      resource: 'Course',
      resourceId: course.id,
      metadata: { changes: data },
    })

    return { id: course.id, title: course.title, status: course.status }
  }

  /**
   * Save the full course curriculum (sections + lessons) in a transaction.
   */
  async saveCurriculum(ctx: RequestContext, courseId: string, sections: CurriculumSection[]) {
    await requirePermission(ctx, 'course', 'update')

    const course = await db.course.findFirst({ where: { id: courseId, workspaceId: ctx.workspace.id } })
    if (!course) throw new Error('Course not found')

    await db.$transaction(async (tx) => {
      const existingSections = await tx.section.findMany({ where: { courseId }, include: { lessons: true } })
      const incomingSectionIds = new Set(sections.map((s) => s.id).filter(Boolean) as string[])

      for (const section of existingSections) {
        if (!incomingSectionIds.has(section.id)) {
          await tx.lesson.deleteMany({ where: { sectionId: section.id } })
          await tx.section.delete({ where: { id: section.id } })
        }
      }

      for (let si = 0; si < sections.length; si++) {
        const sec = sections[si]
        let sectionId: string
        if (sec.id && existingSections.some((s) => s.id === sec.id)) {
          await tx.section.update({ where: { id: sec.id }, data: { title: sec.title, position: sec.position } })
          sectionId = sec.id
        } else {
          const created = await tx.section.create({ data: { courseId, title: sec.title, position: sec.position } })
          sectionId = created.id
        }

        const lessons = sec.lessons ?? []
        const existingLessons = existingSections.find((s) => s.id === sectionId)?.lessons ?? []
        const incomingLessonIds = new Set(lessons.map((l) => l.id).filter(Boolean) as string[])

        for (const lesson of existingLessons) {
          if (!incomingLessonIds.has(lesson.id)) {
            await tx.lesson.delete({ where: { id: lesson.id } })
          }
        }

        for (let li = 0; li < lessons.length; li++) {
          const l = lessons[li]
          const data = {
            title: l.title,
            type: l.type || 'TEXT',
            duration: l.duration || 0,
            isPreview: l.isPreview ?? false,
            content: l.content || '',
            position: l.position,
          }
          if (l.id && existingLessons.some((el) => el.id === l.id)) {
            await tx.lesson.update({ where: { id: l.id }, data })
          } else {
            await tx.lesson.create({ data: { sectionId, ...data } })
          }
        }
      }
    })

    const saved = await db.section.findMany({
      where: { courseId },
      orderBy: { position: 'asc' },
      include: { lessons: { orderBy: { position: 'asc' } } },
    })

    await logAuditEvent('course.curriculum_update', {
      userId: ctx.user.id,
      workspaceId: ctx.workspace.id,
      resource: 'Course',
      resourceId: courseId,
    })

    await logActivity('saved_content', {
      userId: ctx.user.id,
      workspaceId: ctx.workspace.id,
      description: `Saved curriculum for course "${course.title}"`,
      metadata: { courseId },
    })

    return {
      success: true,
      sections: saved.map((s) => ({
        id: s.id, title: s.title, position: s.position,
        lessons: s.lessons.map((l) => ({ id: l.id, title: l.title, type: l.type, duration: l.duration, isPreview: l.isPreview, content: l.content, position: l.position })),
      })),
    }
  }

  async delete(ctx: RequestContext, id: string) {
    await requirePermission(ctx, 'course', 'delete')

    const existing = await db.course.findFirst({
      where: { id, workspaceId: ctx.workspace.id },
    })
    if (!existing) throw new Error('Course not found')

    await db.section.deleteMany({ where: { courseId: id } })
    await db.course.delete({ where: { id } })

    await logAuditEvent('course.delete', {
      userId: ctx.user.id,
      workspaceId: ctx.workspace.id,
      resource: 'Course',
      resourceId: id,
    })

    return { success: true }
  }
}

export const courseService = new CourseService()
