/**
 * @file apps/web/src/app/learning/[courseId]/page.tsx
 * @description Auto-redirect to the first lecture of the selected course.
 */

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { demoStore } from '@/lib/demo-store';

export const dynamic = 'force-dynamic';

export default async function CourseLearningLandingPage({
  params,
}: {
  params: { courseId: string };
}) {
  const { courseId } = params;

  // 1. Try resolving first lesson from database
  try {
    const course = await prisma.course.findFirst({
      where: {
        OR: [{ id: courseId }, { slug: courseId }],
      },
      select: {
        id: true,
        topics: {
          orderBy: { order: 'asc' },
          take: 1,
          select: {
            content: {
              orderBy: { order: 'asc' },
              take: 1,
              select: { id: true },
            },
          },
        },
      },
    });

    const firstLessonId = course?.topics?.[0]?.content?.[0]?.id;
    if (firstLessonId) {
      redirect(`/learning/${course.id}/${firstLessonId}`);
    }
  } catch {
    // Non-fatal if DB unseeded
  }

  // 2. Try resolving from demoStore
  try {
    const storeCourse = demoStore.getCourseById(courseId);
    if (storeCourse?.topics?.[0]?.content?.[0]?.id) {
      redirect(`/learning/${storeCourse.id}/${storeCourse.topics[0].content[0].id}`);
    }
  } catch {
    // Non-fatal
  }

  // 3. Fallback based on known demo courses
  if (courseId.includes('ct') || courseId.includes('python')) {
    redirect(`/learning/c2/l5`);
  }

  redirect(`/learning/c1/l1`);
}
