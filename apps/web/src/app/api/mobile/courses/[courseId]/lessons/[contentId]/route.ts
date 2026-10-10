import { NextResponse } from 'next/server';
import { canAccessCourseContent, getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

/** Return lesson metadata only after checking the same course access rules as playback. */
export async function GET(
  _request: Request,
  { params }: { params: { courseId: string; contentId: string } },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in to open this lesson.' }, { status: 401 });

  try {
    const lesson = await prisma.content.findUnique({
      where: { id: params.contentId },
      select: {
        id: true,
        title: true,
        description: true,
        videoSource: true,
        youtubeUrl: true,
        videoUrl: true,
        duration: true,
        topic: { select: { title: true, courseId: true } },
      },
    });
    if (!lesson || lesson.topic.courseId !== params.courseId) {
      return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 });
    }

    const allowed = await canAccessCourseContent(
      session.userId,
      session.role,
      params.courseId,
      lesson.id,
    );
    if (!allowed) return NextResponse.json({ error: 'This lesson is not available to your account.' }, { status: 403 });

    return NextResponse.json({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      videoSource: lesson.videoSource,
      youtubeUrl: lesson.videoSource.toUpperCase() === 'YOUTUBE'
        ? lesson.youtubeUrl ?? lesson.videoUrl
        : null,
      duration: lesson.duration,
      topic: lesson.topic.title,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Mobile lesson could not be loaded:', error);
    return NextResponse.json({ error: 'This lesson could not be loaded right now.' }, { status: 500 });
  }
}
