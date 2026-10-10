import { NextResponse } from 'next/server'
import { canAccessCourse, getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

/** Return only the signed-in learner's courses and learning progress. */
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Sign in to view your learning.' }, { status: 401 })

  try {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: session.userId,
        status: 'ACTIVE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: {
        id: true,
        accessType: true,
        expiresAt: true,
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            thumbnail: true,
            topics: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                order: true,
                content: {
                  orderBy: { order: 'asc' },
                  select: {
                    id: true,
                    title: true,
                    duration: true,
                    order: true,
                    progress: {
                      where: { userId: session.userId },
                      select: { status: true, videoPosition: true, updatedAt: true },
                      take: 1,
                    },
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
      // Re-check the course boundary so draft/revoked access cannot leak through the summary.
      if (!(await canAccessCourse(session.userId, session.role, enrollment.course.id))) continue
      const lessons = enrollment.course.topics.flatMap((topic) => topic.content.map((content) => ({
        id: content.id,
        title: content.title,
        duration: content.duration,
        status: content.progress[0]?.status ?? 'NOT_STARTED',
        videoPosition: content.progress[0]?.videoPosition ?? 0,
        updatedAt: content.progress[0]?.updatedAt ?? null,
        topic: topic.title,
        topicOrder: topic.order,
        order: content.order,
      })))
      const lastActivity = lessons.reduce<Date | null>((latest, lesson) => {
        if (!lesson.updatedAt) return latest
        return !latest || lesson.updatedAt > latest ? lesson.updatedAt : latest
      }, null)
      courses.push({
        id: enrollment.course.id,
        slug: enrollment.course.slug,
        title: enrollment.course.title,
        description: enrollment.course.description,
        thumbnail: enrollment.course.thumbnail,
        accessType: enrollment.accessType,
        expiresAt: enrollment.expiresAt,
        lessonCount: lessons.length,
        startedCount: lessons.filter((lesson) => lesson.videoPosition > 0 || lesson.status !== 'NOT_STARTED').length,
        completedCount: lessons.filter((lesson) => lesson.status === 'COMPLETED').length,
        lastActivity,
        lessons: lessons.map(({ updatedAt: _updatedAt, ...lesson }) => lesson),
      })
    }

    return NextResponse.json({ user: { email: session.email, role: session.role }, courses })
  } catch (error) {
    console.error('Learner dashboard could not be loaded:', error)
    return NextResponse.json({ error: 'Your learning dashboard is temporarily unavailable.' }, { status: 500 })
  }
}
