import { NextResponse } from 'next/server';
import { getSession, isPlatformManager } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Return aggregate workspace data while preserving each role's course scope. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in to view this dashboard.' }, { status: 401 });

  const platformWide = isPlatformManager(session.role);
  const scopedStaff = session.role === 'ADMIN' || session.role === 'INSTRUCTOR';
  if (!platformWide && !scopedStaff) {
    return NextResponse.json({ error: 'You do not have access to the management dashboard.' }, { status: 403 });
  }

  try {
    // Enforce scoped access in every database query, not only in the dashboard UI.
    const courseWhere = platformWide ? {} : { staffAccess: { some: { userId: session.userId } } };
    const courses = await prisma.course.findMany({
      where: courseWhere,
      orderBy: { updatedAt: 'desc' },
      take: 8,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        updatedAt: true,
        _count: { select: { enrollments: true, quizzes: true, topics: true } },
      },
    });

    const courseIds = platformWide
      ? undefined
      : (await prisma.courseStaffAccess.findMany({
          where: { userId: session.userId },
          select: { courseId: true },
        })).map(({ courseId }) => courseId);
    const courseFilter = courseIds ? { courseId: { in: courseIds } } : {};
    const [courseCount, publishedCourseCount, enrollmentCount, activeEnrollmentCount, quizCount,
      publishedQuizCount, learnerCount, activeLearnerCount, pendingOrderCount, paidOrderCount] = await Promise.all([
      prisma.course.count({ where: courseWhere }),
      prisma.course.count({ where: { ...courseWhere, status: 'PUBLISHED' } }),
      prisma.enrollment.count({ where: courseFilter }),
      prisma.enrollment.count({ where: { ...courseFilter, status: 'ACTIVE', OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } }),
      prisma.quiz.count({ where: courseFilter }),
      prisma.quiz.count({ where: { ...courseFilter, status: 'PUBLISHED' } }),
      platformWide
        ? prisma.user.count({ where: { role: 'STUDENT' } })
        : prisma.user.count({ where: { role: 'STUDENT', enrollments: { some: courseFilter } } }),
      platformWide
        ? prisma.user.count({ where: { role: 'STUDENT', isActive: true } })
        : prisma.user.count({ where: { role: 'STUDENT', isActive: true, enrollments: { some: courseFilter } } }),
      platformWide
        ? prisma.order.count({ where: { status: 'PENDING' } })
        : session.role === 'ADMIN'
          ? prisma.order.count({ where: { status: 'PENDING', items: { some: courseFilter } } })
          : Promise.resolve(null),
      platformWide
        ? prisma.order.count({ where: { status: 'PAID' } })
        : session.role === 'ADMIN'
          ? prisma.order.count({ where: { status: 'PAID', items: { some: courseFilter } } })
          : Promise.resolve(null),
    ]);

    return NextResponse.json({
      role: session.role,
      scope: platformWide ? 'platform' : 'assigned-courses',
      capabilities: {
        manageUsers: platformWide,
        manageCourses: platformWide || session.role === 'ADMIN',
        viewOrders: platformWide || session.role === 'ADMIN',
        readOnly: session.role === 'INSTRUCTOR',
      },
      counts: {
        courses: courseCount,
        publishedCourses: publishedCourseCount,
        learners: learnerCount,
        activeLearners: activeLearnerCount,
        enrollments: enrollmentCount,
        activeEnrollments: activeEnrollmentCount,
        quizzes: quizCount,
        publishedQuizzes: publishedQuizCount,
        pendingOrders: pendingOrderCount,
        paidOrders: paidOrderCount,
      },
      courses: courses.map((course) => ({
        id: course.id,
        title: course.title,
        slug: course.slug,
        status: course.status,
        updatedAt: course.updatedAt,
        learners: course._count.enrollments,
        quizzes: course._count.quizzes,
        topics: course._count.topics,
      })),
    });
  } catch (error) {
    console.error('Manager dashboard summary failed', error);
    return NextResponse.json({ error: 'Dashboard data is temporarily unavailable.' }, { status: 500 });
  }
}
