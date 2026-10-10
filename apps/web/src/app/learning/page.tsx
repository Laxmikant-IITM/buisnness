import Link from 'next/link'
import { getSession, canAccessCourse } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { SignOutButton } from '@/components/auth/sign-out-button'
import './learning.css'

export const dynamic = 'force-dynamic'

export default async function LearningPage() {
  const session = await getSession()
  if (!session) {
    return <main className="learn-shell"><LearnerNav /><section className="learn-empty"><p className="learn-kicker">YOUR LEARNING SPACE</p><h1>Sign in to continue learning.</h1><p>Your courses and saved video progress will show here after your account is connected.</p><Link className="learn-button" href="/sign-in">Sign in <span>→</span></Link></section><LearnerMobileNav /></main>
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.userId, status: 'ACTIVE', OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    select: {
      id: true,
      accessType: true,
      course: {
        select: {
          id: true, slug: true, title: true, description: true, thumbnail: true,
          topics: {
            orderBy: { order: 'asc' },
            select: {
              id: true, title: true, order: true,
              content: {
                orderBy: { order: 'asc' },
                select: {
                  id: true, title: true, duration: true,
                  progress: { where: { userId: session.userId }, select: { status: true, videoPosition: true }, take: 1 },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  const courses = []
  for (const enrollment of enrollments) {
    if (!(await canAccessCourse(session.userId, session.role, enrollment.course.id))) continue
    const lessons = enrollment.course.topics.flatMap((topic) => topic.content.map((lesson) => ({ ...lesson, topicTitle: topic.title })))
    const firstLesson = lessons.find((lesson) => lesson.progress[0]?.videoPosition) ?? lessons[0]
    const started = lessons.filter((lesson) => (lesson.progress[0]?.status && lesson.progress[0].status !== 'NOT_STARTED') || (lesson.progress[0]?.videoPosition ?? 0) > 0).length
    courses.push({ enrollmentId: enrollment.id, accessType: enrollment.accessType, course: enrollment.course, lessons, firstLesson, started })
  }

  return <main className="learn-shell">
    <LearnerNav userName={session.email.split('@')[0]} />
    <section className="learn-intro"><p className="learn-kicker">YOUR LEARNING SPACE</p><h1>Keep your momentum.</h1><p>Your enrolled courses, next lesson, and video progress live here.</p></section>
    {courses.length === 0 ? <section className="learn-empty"><div className="learn-empty-mark">✳</div><h2>No active courses yet</h2><p>When an enrollment is attached to this account, the course and lessons will appear here.</p><Link className="learn-button secondary" href="/">Explore the home page <span>→</span></Link></section> : <section className="learn-course-list" aria-label="Your active courses">
      {courses.map(({ enrollmentId, accessType, course, lessons, firstLesson, started }) => <article className="learn-course" key={enrollmentId}>
        <div className="learn-course-head"><div><p className="learn-kicker">{accessType.replaceAll('_', ' ')}</p><h2>{course.title}</h2>{course.description && <p className="learn-course-description">{course.description}</p>}</div><div className="learn-count"><strong>{lessons.length}</strong><span>lessons</span></div></div>
        <div className="learn-progress-line"><span style={{ width: `${lessons.length ? Math.min(100, Math.round(started / lessons.length * 100)) : 0}%` }} /></div>
        <p className="learn-progress-copy">{started} of {lessons.length} lessons started</p>
        {firstLesson && <Link className="learn-button" href={`/learning/${course.id}/${firstLesson.id}`}>{started ? 'Continue learning' : 'Start learning'} <span>→</span></Link>}
        <details className="learn-syllabus"><summary>View course lessons <span>{lessons.length}</span></summary>
          {course.topics.map((topic) => <div className="learn-topic" key={topic.id}><h3>{topic.title}</h3>{topic.content.map((lesson) => <Link className="learn-lesson-row" key={lesson.id} href={`/learning/${course.id}/${lesson.id}`}><span aria-hidden="true">▶</span><span>{lesson.title}</span><small>{lesson.duration || 'Lesson'}</small></Link>)}</div>)}
          {course.topics.length === 0 && <p className="learn-muted">Lessons have not been added to this course yet.</p>}
        </details>
      </article>)}
    </section>}
    <LearnerMobileNav />
  </main>
}

function LearnerNav({ userName }: { userName?: string }) {
  return <header className="learn-nav"><Link className="learn-brand" href="/">northstar<span>.</span></Link><nav aria-label="Learning navigation"><Link href="/">Home</Link><Link href="/learning" aria-current="page">My learning</Link></nav>{userName ? <div className="learn-user-area"><span className="learn-user">Hi, {userName}</span><SignOutButton /></div> : <Link className="learn-signin-link" href="/sign-in">Sign in</Link>}</header>
}

function LearnerMobileNav() {
  return <nav className="learn-mobile-nav" aria-label="Mobile learning navigation"><Link href="/">⌂<small>Home</small></Link><Link href="/learning" aria-current="page">◉<small>Learning</small></Link><Link href="/">⌕<small>Explore</small></Link><Link href="/">☻<small>Account</small></Link></nav>
}
