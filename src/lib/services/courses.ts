import { db } from '@/lib/db'
import { logAuditEvent, logActivity } from '@/lib/logging'
import { type RequestContext, requirePermission } from '@/lib/context'

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
    price?: number
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
        price: data.price || 0,
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

    const course = await db.course.update({ where: { id }, data })

    await logAuditEvent('course.update', {
      userId: ctx.user.id,
      workspaceId: ctx.workspace.id,
      resource: 'Course',
      resourceId: course.id,
      metadata: { changes: data },
    })

    return { id: course.id, title: course.title, status: course.status }
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
