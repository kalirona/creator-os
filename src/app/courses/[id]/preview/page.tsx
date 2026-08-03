import { CoursePlayer } from '@/components/course-player/player'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PreviewPage({ params }: Props) {
  const { id } = await params
  return <CoursePlayer courseId={id} />
}