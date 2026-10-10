import Link from 'next/link'
import { notFound } from 'next/navigation'
import { canAccessCourse, canAccessCourseContent, getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import LectureVideoPlayer from '@/features/learning/video-player/LectureVideoPlayer'
import { LearnerMobileNavigation } from '../../player-shell'
import '../../learning.css'

export const dynamic = 'force-dynamic'

export default async function LessonPage({ params }: { params: { courseId: string; contentId: string } }) {
  const session = await getSession()
  if (!session) return <main className="learn-shell"><header className="learn-nav"><Link className="learn-brand" href="/">northstar<span>.</span></Link><Link href="/learning">My learning</Link></header><section className="learn-empty"><p className="learn-kicker">LESSON ACCESS</p><h1>Sign in to watch this lesson.</h1><p>Playback is available only to an authenticated account with access to this course.</p><Link className="learn-button" href="/learning">Go to my learning <span>→</span></Link></section><LearnerMobileNavigation /></main>

  const lesson = await prisma.content.findUnique({
    where: { id: params.contentId },
    select: {
      id: true, title: true, description: true, videoUrl: true, youtubeUrl: true, videoSource: true, duration: true,
      topic: {
        select: {
          title: true,
          course: {
            select: {
              id: true, title: true,
              topics: {
                orderBy: { order: 'asc' },
                select: {
                  id: true, title: true, order: true,
                  content: { orderBy: { order: 'asc' }, select: { id: true, title: true } },
                },
              },
            },
          },
        },
      },
    },
  })
  if (!lesson || lesson.topic.course.id !== params.courseId) notFound()

  // Provider URLs stay server-side until the signed-in user passes the content access check.
  const allowed = await canAccessCourse(session.userId, session.role, params.courseId)
    && await canAccessCourseContent(session.userId, session.role, params.courseId, lesson.id)
  if (!allowed) return <main className="learn-shell"><header className="learn-nav"><Link className="learn-brand" href="/">northstar<span>.</span></Link><Link href="/learning">My learning</Link></header><section className="learn-empty"><p className="learn-kicker">COURSE ACCESS</p><h1>This lesson isn’t available to this account.</h1><p>Check that you are signed in with an active enrollment or course assignment.</p><Link className="learn-button" href="/learning">Back to my learning <span>→</span></Link></section><LearnerMobileNavigation /></main>

  const topics = lesson.topic.course.topics
  const allLessons = topics.flatMap((topic) => topic.content.map((content) => ({ ...content, topicId: topic.id, topicTitle: topic.title })))
  const index = allLessons.findIndex((content) => content.id === lesson.id)
  const previous = allLessons[index - 1]
  const next = allLessons[index + 1]

  return <main className="learn-shell player-page">
    <header className="learn-nav"><Link className="learn-brand" href="/">northstar<span>.</span></Link><nav aria-label="Learning navigation"><Link href="/">Home</Link><Link href="/learning" aria-current="page">My learning</Link></nav><Link className="learn-back" href="/learning">← My courses</Link></header>
    <div className="player-crumb"><Link href="/learning">My learning</Link><span>/</span><span>{lesson.topic.course.title}</span></div>
    <div className="player-layout">
      <section className="player-main"><div className="player-frame"><LectureVideoPlayer videoUrl={lesson.videoUrl ?? undefined} youtubeUrl={lesson.youtubeUrl ?? undefined} videoSource={lesson.videoSource} title={lesson.title} contentId={lesson.id} /></div>
        <div className="player-title"><p className="learn-kicker">{lesson.topic.title}{lesson.duration ? ` · ${lesson.duration}` : ''}</p><h1>{lesson.title}</h1>{lesson.description && <p>{lesson.description}</p>}</div>
        <div className="player-next-row"><Link className={previous ? 'learn-button secondary' : 'learn-button disabled'} aria-disabled={!previous} href={previous ? `/learning/${params.courseId}/${previous.id}` : '#'}>← Previous lesson</Link>{next ? <Link className="learn-button" href={`/learning/${params.courseId}/${next.id}`}>Next lesson <span>→</span></Link> : <span className="learn-end-note">You’ve reached the end of this course.</span>}</div>
      </section>
      <aside className="player-syllabus"><p className="learn-kicker">COURSE CONTENT</p><h2>{lesson.topic.course.title}</h2>{topics.map((topic) => <section className="player-topic" key={topic.id}><h3>{topic.title}</h3>{topic.content.map((content) => <Link aria-current={content.id === lesson.id ? 'page' : undefined} className="player-syllabus-lesson" key={content.id} href={`/learning/${params.courseId}/${content.id}`}><span aria-hidden="true">{content.id === lesson.id ? '▶' : '○'}</span>{content.title}</Link>)}</section>)}</aside>
    </div>
    <LearnerMobileNavigation />
  </main>
}
