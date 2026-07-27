import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const courses = await db.course.findMany({
    orderBy: { createdAt: 'desc' },
    include: { sections: { include: { lessons: true }, orderBy: { position: 'asc' } } },
  })
  return NextResponse.json(courses.map((c) => ({
    id: c.id, title: c.title, description: c.description, category: c.category,
    price: c.price, level: c.level, rating: c.rating, studentsCount: c.studentsCount,
    status: c.status, thumbnailUrl: c.thumbnailUrl,
    sections: c.sections.map((s) => ({
      id: s.id, title: s.title, position: s.position,
      lessons: s.lessons.map((l) => ({ id: l.id, title: l.title, type: l.type, duration: l.duration, isPreview: l.isPreview, content: l.content })),
    })),
    totalLessons: c.sections.reduce((acc, s) => acc + s.lessons.length, 0),
    totalDuration: c.sections.reduce((acc, s) => acc + s.lessons.reduce((a, l) => a + l.duration, 0), 0),
  })))
}
