import { CourseBuilder } from '@/components/course-builder/builder'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function BuildPage({ params }: Props) {
  const { id } = await params
  return <CourseBuilder courseId={id} />
}