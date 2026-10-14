/**
 * @file apps/web/src/app/api/auth/demo-login/route.ts
 * @description Quick Role Shortcut Login API for testing all 5 role tiers.
 *
 * Provides 1-click authentication for:
 * 1. SUPER_MANAGER (Platform root, user administration, financial totals)
 * 2. MANAGER (Course studio, proctored exam scheduler & telemetry moderation)
 * 3. ADMIN (Course curriculum management, module authoring)
 * 4. INSTRUCTOR (Assigned courses, homework grading, student support)
 * 5. STUDENT (Learner testing room, Piston IDE, CGPA predictor, referrals)
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSessionToken, DEMO_USERS, SESSION_COOKIE, UserRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

const demoLoginSchema = z.object({
  role: z.enum(['SUPER_MANAGER', 'MANAGER', 'ADMIN', 'INSTRUCTOR', 'STUDENT']),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = demoLoginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid role selection.' }, { status: 400 });
  }

  const role = parsed.data.role;

  // Find demo account for selected role
  const demoEntry = Object.values(DEMO_USERS).find((u) => u.role === role);
  if (!demoEntry) {
    return NextResponse.json({ error: 'Role account profile not found.' }, { status: 404 });
  }

  // Attempt to persist or sync with database if DB is reachable
  try {
    await prisma.user.upsert({
      where: { id: demoEntry.id },
      update: {
        role: demoEntry.role,
        name: demoEntry.name,
        email: demoEntry.email,
        isActive: true,
        isTerminated: false,
      },
      create: {
        id: demoEntry.id,
        name: demoEntry.name,
        email: demoEntry.email,
        role: demoEntry.role,
        securityNumber: demoEntry.securityNumber,
        referralCode: demoEntry.referralCode,
        walletBalance: demoEntry.walletBalance,
        streakDays: demoEntry.streakDays,
        xp: demoEntry.xp,
        iitmLevel: demoEntry.iitmLevel,
        isProfileComplete: true,
        hasSeenWelcome: true,
        isActive: true,
      },
    });
  } catch {
    // Non-fatal if database is currently offline during offline local evaluation
  }

  // Sign cryptographic session token
  const token = await createSessionToken(
    {
      userId: demoEntry.id,
      email: demoEntry.email,
      role: demoEntry.role,
    },
    1 // tokenVersion
  );

  const response = NextResponse.json({
    success: true,
    user: {
      id: demoEntry.id,
      name: demoEntry.name,
      email: demoEntry.email,
      role: demoEntry.role,
      clearance: demoEntry.clearance,
    },
    redirectTo: '/dashboard',
  });

  // Set secure session cookie
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
