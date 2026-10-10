import { cookies, headers } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import { prisma } from '@/lib/db';

const SESSION_COOKIE = 'lms_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface Session {
  userId: string;
  email: string;
  role: string;
}

/** Roles granted only after Google's verified email claim matches the account. */
export const GOOGLE_EMAIL_ROLES: Record<string, string> = {
  'lkiitmng2428@gmail.com': 'MANAGER',
  'pay.laxmikant@gmail.com': 'SUPER_MANAGER',
  'team.alphaiitian@gmail.com': 'ADMIN',
  'care.alpha.iitian@gmail.com': 'STUDENT',
};

export function roleForVerifiedGoogleEmail(email: string) {
  return GOOGLE_EMAIL_ROLES[email.trim().toLowerCase()] ?? 'STUDENT';
}

function getSessionKey() {
  const secret = process.env.SESSION_SECRET;
  // Fail closed: production must supply a unique 32+ character secret.
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set to at least 32 characters.');
  }
  return new TextEncoder().encode(secret);
}

/** Sign a short-lived app session after the login service verifies credentials. */
export async function createSessionToken(session: Session, tokenVersion: number) {
  return new SignJWT({ ...session, tokenVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSessionKey());
}

/** Read the app cookie or bearer token, then reload current role/status from DB. */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const headerStore = await headers();
    const cookieToken = cookieStore.get(SESSION_COOKIE)?.value;
    const authorization = headerStore.get('authorization');
    const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    const token = cookieToken || bearerToken;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getSessionKey());
    if (typeof payload.userId !== 'string' || typeof payload.tokenVersion !== 'number') return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isActive: true, tokenVersion: true },
    });
    if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) return null;

    return { userId: user.id, email: user.email, role: user.role };
  } catch {
    return null;
  }
}

/** Platform-wide privileges belong only to the two platform management roles. */
export function isPlatformManager(role: string) {
  return role === 'SUPER_MANAGER' || role === 'MANAGER';
}

/** Look up the explicit course assignment used by scoped staff roles. */
export async function hasCourseStaffAccess(userId: string, courseId: string) {
  const assignment = await prisma.courseStaffAccess.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true },
  });
  return Boolean(assignment);
}

/** Admins can manage only assigned courses; instructors remain read-only. */
export async function canManageCourse(userId: string, role: string, courseId: string) {
  if (isPlatformManager(role)) return true;
  if (role !== 'ADMIN') return false;
  return hasCourseStaffAccess(userId, courseId);
}

/** Read access to course workspaces follows the same staff and enrollment scopes. */
export async function canAccessCourse(userId: string, role: string, courseId: string) {
  if (isPlatformManager(role)) return true;
  if (role === 'ADMIN' || role === 'INSTRUCTOR') {
    return hasCourseStaffAccess(userId, courseId);
  }
  if (role !== 'STUDENT') return false;
  // Learner-facing course routes must not leak quiz/catalog material from drafts.
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { status: true } });
  if (course?.status !== 'PUBLISHED') return false;
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId,
      status: 'ACTIVE',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { id: true },
  });
  return Boolean(enrollment);
}

/** Apply role scope first, then grant students access only through enrollment. */
export async function canAccessCourseContent(
  userId: string,
  role: string,
  courseId: string,
  contentId: string,
) {
  if (isPlatformManager(role)) return true;
  if (role === 'ADMIN' || role === 'INSTRUCTOR') {
    return hasCourseStaffAccess(userId, courseId);
  }
  if (role !== 'STUDENT') return false;
  // Learners must meet both course-publication and active-enrollment rules before opening content.
  if (!(await canAccessCourse(userId, role, courseId))) return false;
  return isStudentEnrolledInContent(userId, contentId, courseId);
}

/** Check content access from the current enrollment record, not from the UI. */
export async function isStudentEnrolledInContent(
  userId: string,
  contentId: string,
  nativeCourseId?: string | null,
): Promise<boolean> {
  // Demo lessons still require an active enrollment until public preview access is explicitly designed.
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    select: { topic: { select: { courseId: true } } },
  });
  const courseId = nativeCourseId || content?.topic.courseId;
  if (!courseId) return false;

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId,
      status: 'ACTIVE',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { id: true },
  });
  return Boolean(enrollment);
}

/** Stream tokens are optional; normal app sessions remain the primary path. */
export async function verifyStreamToken(token: string): Promise<{ userId: string; lectureId: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionKey());
    if (
      typeof payload.userId !== 'string' ||
      typeof payload.lectureId !== 'string' ||
      typeof payload.role !== 'string'
    ) return null;

    // A valid signature alone must not preserve privileges after account or role changes.
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true, isActive: true },
    });
    if (!user || !user.isActive || user.role !== payload.role) return null;

    return { userId: payload.userId, lectureId: payload.lectureId, role: user.role };
  } catch {
    return null;
  }
}
