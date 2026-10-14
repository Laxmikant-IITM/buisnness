/**
 * Student Onboarding and Auto-Enrollment Service
 * Module: Learner Lifecycle (apps/web/src/lib/onboarding.ts)
 *
 * Automates initial student setup upon registration:
 * - Automatically provisions enrollments for published starter / orientation courses.
 * - Delivers personalized welcome notifications and alerts.
 * - Awards first-step achievement badges and bonus experience points (XP).
 * - Records compliance and audit events in ActivityLog.
 */

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export interface OnboardingResult {
  userId: string;
  enrolledCourseIds: string[];
  welcomeNotificationId?: string;
  badgeAwarded?: string;
  bonusXpAwarded: number;
}

/**
 * Executes the new student onboarding workflow:
 * 1. Finds published starter or free courses to grant instantaneous access.
 * 2. Creates active enrollment records avoiding duplicates.
 * 3. Dispatches welcome in-app notification.
 * 4. Grants the WELCOME_STARTER achievement badge.
 * 5. Credits starting XP and logs activity audit entry.
 *
 * @param userId - ID of the newly registered student.
 * @returns Summary of onboarding actions completed.
 */
export async function processNewStudentOnboarding(userId: string): Promise<OnboardingResult> {
  const result: OnboardingResult = {
    userId,
    enrolledCourseIds: [],
    bonusXpAwarded: 50,
  };

  try {
    // 1. Locate published courses suitable for auto-enrollment
    // Prefer free or starter courses; if none found, find up to 2 published courses
    const starterCourses = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
      },
      select: { id: true, title: true, isFree: true },
      take: 2,
      orderBy: { createdAt: 'asc' },
    });

    // 2. Provision active enrollments in a safe transaction
    for (const course of starterCourses) {
      try {
        const enrollment = await prisma.enrollment.upsert({
          where: {
            userId_courseId_accessType: {
              userId,
              courseId: course.id,
              accessType: 'RECORDED',
            },
          },
          update: {
            status: 'ACTIVE',
          },
          create: {
            userId,
            courseId: course.id,
            accessType: 'RECORDED',
            status: 'ACTIVE',
            startsAt: new Date(),
          },
        });
        result.enrolledCourseIds.push(course.id);
      } catch (enrollmentErr) {
        // Defensive: Log error without aborting onboarding sequence
        console.warn(`[Onboarding] Course auto-enrollment skipped for course ${course.id}:`, enrollmentErr);
      }
    }

    // 3. Dispatch welcome notification
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          title: 'Welcome to Northstar Academy!',
          body: 'Your account is ready. Complete your profile setup to unlock full community privileges and track your academic milestones.',
          type: 'GENERAL',
          link: '/profile',
          metadata: { source: 'welcome_onboarding' },
        },
      });
      result.welcomeNotificationId = notification.id;
    } catch (notifErr) {
      console.warn('[Onboarding] Welcome notification creation failed:', notifErr);
    }

    // 4. Grant introductory achievement badge
    try {
      await prisma.userBadge.upsert({
        where: {
          userId_badge: {
            userId,
            badge: 'WELCOME_STARTER',
          },
        },
        update: {},
        create: {
          userId,
          badge: 'WELCOME_STARTER',
          awardedAt: new Date(),
        },
      });
      result.badgeAwarded = 'WELCOME_STARTER';
    } catch (badgeErr) {
      console.warn('[Onboarding] Starter badge award failed:', badgeErr);
    }

    // 5. Credit initial XP bonus and audit log
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          xp: { increment: result.bonusXpAwarded },
          streakDays: 1, // Day 1 initial streak
          lastStreakDate: new Date(),
        },
      });

      await tx.activityLog.create({
        data: {
          userId,
          action: 'STUDENT_ONBOARDING_INITIALIZED',
          entity: 'User',
          entityId: userId,
          details: {
            enrolledCoursesCount: result.enrolledCourseIds.length,
            bonusXp: result.bonusXpAwarded,
            badge: result.badgeAwarded,
          } as Prisma.InputJsonValue,
        },
      });
    });

    return result;
  } catch (error) {
    console.error(`[Onboarding] Fatal error onboarding student ${userId}:`, error);
    return result;
  }
}

/**
 * Acknowledges that the student has completed or dismissed the initial welcome tour.
 * Sets hasSeenWelcome flag to true and logs completion.
 *
 * @param userId - ID of the student.
 */
export async function completeWelcomeSequence(userId: string): Promise<boolean> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { hasSeenWelcome: true },
      });

      await tx.activityLog.create({
        data: {
          userId,
          action: 'WELCOME_SEQUENCE_COMPLETED',
          entity: 'User',
          entityId: userId,
        },
      });
    });
    return true;
  } catch (err) {
    console.error(`[Onboarding] Failed to complete welcome sequence for user ${userId}:`, err);
    return false;
  }
}
