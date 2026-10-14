/**
 * Current Authenticated User Introspection API Route
 * Module: Authentication (apps/web/src/app/api/auth/me/route.ts)
 *
 * Returns complete sanitized session metadata for the current user:
 * - User profile attributes and identity status.
 * - Dynamic permissions based on the role hierarchy.
 * - Role hierarchy rank (1 to 5).
 * - Accessible courses based on enrollment or staff assignments.
 * - Gamification ledger (XP, streak, level, wallet balance).
 * - Pending account deletion status if active.
 */

import { NextResponse } from 'next/server';
import { getFullSession, isPlatformManager } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Retrieves the currently authenticated user's profile and workspace state.
 *
 * @returns JSON response containing complete sanitized user metadata.
 */
export async function GET() {
  const user = await getFullSession();

  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated. Please sign in.' }, { status: 401 });
  }

  try {
    // 1. Fetch accessible courses based on user role
    let accessibleCourses: Array<{
      id: string;
      slug: string;
      title: string;
      thumbnail: string | null;
      roleInCourse?: string;
    }> = [];

    if (isPlatformManager(user.role)) {
      // Platform managers can access all published courses
      accessibleCourses = await prisma.course.findMany({
        where: { status: 'PUBLISHED' },
        select: { id: true, slug: true, title: true, thumbnail: true },
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    } else if (user.role === 'ADMIN' || user.role === 'INSTRUCTOR') {
      const staffAccess = await prisma.courseStaffAccess.findMany({
        where: { userId: user.id },
        include: {
          course: { select: { id: true, slug: true, title: true, thumbnail: true } },
        },
      });
      accessibleCourses = staffAccess.map((item) => ({
        ...item.course,
        roleInCourse: user.role,
      }));
    } else {
      // Students: Active enrollments
      const enrollments = await prisma.enrollment.findMany({
        where: {
          userId: user.id,
          status: 'ACTIVE',
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: {
          course: { select: { id: true, slug: true, title: true, thumbnail: true } },
        },
      });
      accessibleCourses = enrollments.map((e) => e.course);
    }

    // 2. Check for active account deletion request
    const pendingDeletion = await prisma.accountDeletionRequest.findFirst({
      where: {
        userId: user.id,
        status: 'PENDING',
        gracePeriodEndsAt: { gt: new Date() },
      },
      select: {
        id: true,
        reason: true,
        status: true,
        gracePeriodEndsAt: true,
        createdAt: true,
      },
    });

    // 3. Badges earned
    const badges = await prisma.userBadge.findMany({
      where: { userId: user.id },
      select: { badge: true, awardedAt: true },
      orderBy: { awardedAt: 'desc' },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleRank: user.roleRank,
        permissions: user.permissions,
        isActive: user.isActive,
        isProfileComplete: user.isProfileComplete,
        hasSeenWelcome: user.hasSeenWelcome,
        isGoogleUser: user.isGoogleUser,
        securityNumber: user.securityNumber,
        referralCode: user.referralCode,
        avatar: user.avatar,
        mobileNumber: user.mobileNumber,
        gender: user.gender,
        age: user.age,
        state: user.state,
        aboutMe: user.aboutMe,
        instagramUrl: user.instagramUrl,
        linkedinUrl: user.linkedinUrl,
        iitmLevel: user.iitmLevel,
        iitmUserType: user.iitmUserType,
        iitmJoinYear: user.iitmJoinYear,
        iitmJoinMonth: user.iitmJoinMonth,
        xp: user.xp,
        highestLevelReached: user.highestLevelReached,
        streakDays: user.streakDays,
        lastStreakDate: user.lastStreakDate,
        walletBalance: user.walletBalance,
        lifetimeReferrals: user.lifetimeReferrals,
        quarterlyReferrals: user.quarterlyReferrals,
        createdAt: user.createdAt,
      },
      accessibleCourses,
      badges,
      pendingDeletion,
    });
  } catch (error) {
    console.error('[Me API] Error loading user context:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve complete user profile.' },
      { status: 500 }
    );
  }
}
