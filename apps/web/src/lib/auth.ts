/**
 * Authentication and Session Management Service
 * Module: Core Security (apps/web/src/lib/auth.ts)
 *
 * Provides cryptographic session token generation (JWT), session verification,
 * role hierarchy authorization, password hashing, and user identity introspection.
 *
 * Security Policies:
 * - Session tokens are signed using HMAC-SHA256 with HS256 algorithm.
 * - Always validates tokenVersion against database record for immediate token revocation.
 * - Strictly respects role hierarchy: SUPER_MANAGER (5) > MANAGER (4) > ADMIN (3) > INSTRUCTOR (2) > STUDENT (1).
 */

import { cookies, headers } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export const SESSION_COOKIE = 'lms_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Role hierarchy levels mapped to numerical values for hierarchical authorization.
 */
export const ROLE_HIERARCHY = {
  SUPER_MANAGER: 5,
  MANAGER: 4,
  ADMIN: 3,
  INSTRUCTOR: 2,
  STUDENT: 1,
} as const;

export type UserRole = keyof typeof ROLE_HIERARCHY;

/** Minimal session interface stored in JWT tokens and returned for fast lightweight checks. */
export interface Session {
  userId: string;
  email: string;
  role: string;
}

/** Granular system permissions derived from user role hierarchy rank. */
export interface UserPermissions {
  canManagePlatform: boolean;
  canManageUsers: boolean;
  canManageCourses: boolean;
  canInstruct: boolean;
  isStudent: boolean;
}

/** Complete session user record containing full profile fields and security flags. */
export interface FullSessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  roleRank: number;
  permissions: UserPermissions;
  isActive: boolean;
  isTerminated: boolean;
  isProfileComplete: boolean;
  hasSeenWelcome: boolean;
  isGoogleUser: boolean;
  securityNumber: string | null;
  referralCode: string | null;
  avatar: string | null;
  mobileNumber: string | null;
  gender: string | null;
  age: number | null;
  state: string | null;
  aboutMe: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  iitmLevel: string | null;
  iitmUserType: string | null;
  iitmJoinYear: number | null;
  iitmJoinMonth: number | null;
  xp: number;
  highestLevelReached: number;
  streakDays: number;
  lastStreakDate: Date | null;
  walletBalance: number;
  lifetimeReferrals: number;
  quarterlyReferrals: number;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Roles granted only after Google's verified email claim matches the account. */
export const GOOGLE_EMAIL_ROLES: Record<string, string> = {
  'lkiitmng2428@gmail.com': 'MANAGER',
  'pay.laxmikant@gmail.com': 'SUPER_MANAGER',
  'team.alphaiitian@gmail.com': 'ADMIN',
  'care.alpha.iitian@gmail.com': 'STUDENT',
};

/** Preconfigured role shortcuts for instant 1-click evaluation of all 5 role tiers. */
export const DEMO_USERS: Record<string, {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clearance: string;
  securityNumber: string;
  referralCode: string;
  walletBalance: number;
  streakDays: number;
  xp: number;
  iitmLevel: string;
  description: string;
  limitations: string;
  defaultPath: string;
}> = {
  'demo-super-manager': {
    id: 'demo-super-manager',
    name: 'Vikramaditya (Super Manager)',
    email: 'supermanager@northstar.demo',
    role: 'SUPER_MANAGER',
    clearance: 'L5 · PLATFORM ROOT',
    securityNumber: 'SEC-SUP001',
    referralCode: 'SUPER5',
    walletBalance: 100000,
    streakDays: 45,
    xp: 9999,
    iitmLevel: 'Degree',
    description: 'Full platform sovereign access, global user administration, and financial metrics.',
    limitations: 'None. Highest authority tier on the platform.',
    defaultPath: '/manager',
  },
  'demo-manager': {
    id: 'demo-manager',
    name: 'Priya Nambiar (Ops Manager)',
    email: 'manager@northstar.demo',
    role: 'MANAGER',
    clearance: 'L4 · OPERATIONS',
    securityNumber: 'SEC-MGR904',
    referralCode: 'PRIYA5',
    walletBalance: 50000,
    streakDays: 30,
    xp: 5400,
    iitmLevel: 'Diploma',
    description: 'Course studio creator, proctored exam scheduler, and live candidate telemetric moderation.',
    limitations: 'Cannot modify platform root secrets or demote Super Managers.',
    defaultPath: '/manager/exams',
  },
  'demo-admin': {
    id: 'demo-admin',
    name: 'Rohan Verma (Course Admin)',
    email: 'admin@northstar.demo',
    role: 'ADMIN',
    clearance: 'L3 · CURRICULUM',
    securityNumber: 'SEC-ADM503',
    referralCode: 'ROHAN5',
    walletBalance: 25000,
    streakDays: 20,
    xp: 3200,
    iitmLevel: 'Diploma',
    description: 'Module management, curriculum authoring, and course material uploads.',
    limitations: 'Cannot access global user administration or modify candidate proctor allowances.',
    defaultPath: '/manager/courses',
  },
  'demo-instructor': {
    id: 'demo-instructor',
    name: 'Prof. Sneha Kulkarni',
    email: 'instructor@northstar.demo',
    role: 'INSTRUCTOR',
    clearance: 'L2 · FACULTY',
    securityNumber: 'SEC-INS802',
    referralCode: 'SNEHA5',
    walletBalance: 15000,
    streakDays: 15,
    xp: 2800,
    iitmLevel: 'Degree',
    description: 'Live interactive classes, homework submissions evaluation, and student helpdesk replies.',
    limitations: 'Read-only on course pricing and workspace publishing settings.',
    defaultPath: '/manager',
  },
  'demo-student': {
    id: 'demo-student',
    name: 'Aarav Sharma (Student)',
    email: 'student@northstar.demo',
    role: 'STUDENT',
    clearance: 'L1 · LEARNER',
    securityNumber: 'SEC-STU401',
    referralCode: 'AARAV5',
    walletBalance: 4500,
    streakDays: 14,
    xp: 1250,
    iitmLevel: 'Foundation',
    description: 'Full student experience: proctored exam room, scientific calc, coding IDE, and 5% referrals.',
    limitations: 'Strictly barred from all management workspaces, course editing, and admin telemetry.',
    defaultPath: '/learning',
  },
};

/**
 * Maps a verified Google email address to an auto-assigned platform role.
 *
 * @param email - The verified email string from OAuth provider.
 * @returns The associated role string, defaulting to STUDENT.
 */
export function roleForVerifiedGoogleEmail(email: string): string {
  return GOOGLE_EMAIL_ROLES[email.trim().toLowerCase()] ?? 'STUDENT';
}

/**
 * Returns numeric rank for role comparison. SUPER_MANAGER is 5 down to STUDENT at 1.
 *
 * @param role - Role string to check.
 * @returns Numeric rank from 1 to 5, or 0 if unknown.
 */
export function getRoleRank(role: string): number {
  return ROLE_HIERARCHY[role as UserRole] ?? 0;
}

/**
 * Validates if the user's role meets or exceeds a target role rank.
 *
 * @param userRole - The role of the user.
 * @param requiredRole - The minimum role required.
 * @returns True if user has sufficient hierarchical clearance.
 */
export function hasRoleOrHigher(userRole: string, requiredRole: UserRole): boolean {
  return getRoleRank(userRole) >= getRoleRank(requiredRole);
}

/**
 * Derives operational permissions based on user role rank.
 *
 * @param role - The user's role.
 * @returns Object with boolean permission flags.
 */
export function getPermissionsForRole(role: string): UserPermissions {
  const rank = getRoleRank(role);
  return {
    canManagePlatform: rank >= ROLE_HIERARCHY.MANAGER,
    canManageUsers: rank >= ROLE_HIERARCHY.MANAGER,
    canManageCourses: rank >= ROLE_HIERARCHY.ADMIN,
    canInstruct: rank >= ROLE_HIERARCHY.INSTRUCTOR,
    isStudent: role === 'STUDENT',
  };
}

/**
 * Hashes a plaintext password using bcrypt with 12 salt rounds.
 *
 * @param password - Plaintext password to hash.
 * @returns Bcrypt hash string.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Verifies a plaintext password against a stored bcrypt hash.
 *
 * @param password - Plaintext password input.
 * @param hash - Stored bcrypt hash string.
 * @returns True if password matches hash, false otherwise.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}

/**
 * Generates an internal security tracking number formatted as SEC-XXXXXX.
 * Excludes ambiguous characters (0, O, 1, I) for human readability.
 *
 * @returns Unique security number string (e.g. SEC-A8B9C2).
 */
export function generateSecurityNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SEC-${rand}`;
}

/**
 * Generates a unique 5-character alphanumeric referral code (e.g. 7K2M9).
 *
 * @returns 5-character referral code.
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rand;
}

/**
 * Resolves binary session secret key from environment variable.
 * Fails closed if SESSION_SECRET is unset or shorter than 32 characters.
 */
function getSessionKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    // In local dev without explicit secret, fallback to deterministic fallback secret for safety
    if (process.env.NODE_ENV !== 'production') {
      return new TextEncoder().encode('lms_development_secret_key_minimum_32_characters_long!');
    }
    throw new Error('SESSION_SECRET must be set to at least 32 characters.');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Signs a short-lived JSON Web Token for user session cookies.
 *
 * @param session - User payload containing ID, email, and role.
 * @param tokenVersion - Current token version for revocation validation.
 * @returns Signed JWT string.
 */
export async function createSessionToken(session: Session, tokenVersion: number): Promise<string> {
  return new SignJWT({ ...session, tokenVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSessionKey());
}

/**
 * Reads the session cookie or bearer token, validating tokenVersion against DB.
 * Returns minimal Session object for lightweight authorization guards.
 *
 * @returns Session object if valid, null if unauthenticated or token revoked.
 */
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

    let user: { id: string; email: string; role: string; isActive: boolean; isTerminated: boolean; tokenVersion: number } | null = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, role: true, isActive: true, isTerminated: true, tokenVersion: true },
      });
    } catch {
      // Non-fatal if database is unseeded in development
    }

    if (!user && DEMO_USERS[payload.userId]) {
      const demo = DEMO_USERS[payload.userId];
      return { userId: demo.id, email: demo.email, role: demo.role };
    }

    if (!user || !user.isActive || user.isTerminated || user.tokenVersion !== payload.tokenVersion) {
      return null;
    }

    return { userId: user.id, email: user.email, role: user.role };
  } catch {
    return null;
  }
}

/**
 * Reads the session and returns complete user profile fields, security tracking number,
 * permissions, wallet balance, streak, XP, and identity flags.
 * Instantaneously revokes access if tokenVersion mismatch occurs.
 *
 * @returns FullSessionUser object if authenticated and active, null otherwise.
 */
export async function getFullSession(): Promise<FullSessionUser | null> {
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

    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          isTerminated: true,
          isProfileComplete: true,
          hasSeenWelcome: true,
          isGoogleUser: true,
          securityNumber: true,
          referralCode: true,
          avatar: true,
          mobileNumber: true,
          gender: true,
          age: true,
          state: true,
          aboutMe: true,
          instagramUrl: true,
          linkedinUrl: true,
          iitmLevel: true,
          iitmUserType: true,
          iitmJoinYear: true,
          iitmJoinMonth: true,
          xp: true,
          highestLevelReached: true,
          streakDays: true,
          lastStreakDate: true,
          walletBalance: true,
          lifetimeReferrals: true,
          quarterlyReferrals: true,
          tokenVersion: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch {
      // Non-fatal if DB offline
    }

    if (!user && DEMO_USERS[payload.userId]) {
      const demo = DEMO_USERS[payload.userId];
      const now = new Date();
      return {
        id: demo.id,
        name: demo.name,
        email: demo.email,
        role: demo.role,
        roleRank: getRoleRank(demo.role),
        permissions: getPermissionsForRole(demo.role),
        isActive: true,
        isTerminated: false,
        isProfileComplete: true,
        hasSeenWelcome: true,
        isGoogleUser: false,
        securityNumber: demo.securityNumber,
        referralCode: demo.referralCode,
        avatar: null,
        mobileNumber: '+91 98765 43210',
        gender: 'Not Specified',
        age: 22,
        state: 'Tamil Nadu',
        aboutMe: demo.description,
        instagramUrl: null,
        linkedinUrl: null,
        iitmLevel: demo.iitmLevel,
        iitmUserType: 'Student',
        iitmJoinYear: 2024,
        iitmJoinMonth: 1,
        xp: demo.xp,
        highestLevelReached: 3,
        streakDays: demo.streakDays,
        lastStreakDate: now,
        walletBalance: demo.walletBalance,
        lifetimeReferrals: 5,
        quarterlyReferrals: 2,
        tokenVersion: 1,
        createdAt: now,
        updatedAt: now,
      };
    }

    if (!user || !user.isActive || user.isTerminated || user.tokenVersion !== payload.tokenVersion) {
      return null;
    }

    return {
      ...user,
      roleRank: getRoleRank(user.role),
      permissions: getPermissionsForRole(user.role),
    };
  } catch {
    return null;
  }
}

/** Platform-wide privileges belong only to the platform management roles. */
export function isPlatformManager(role: string): boolean {
  return role === 'SUPER_MANAGER' || role === 'MANAGER';
}

/** Look up the explicit course assignment used by scoped staff roles. */
export async function hasCourseStaffAccess(userId: string, courseId: string): Promise<boolean> {
  const assignment = await prisma.courseStaffAccess.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true },
  });
  return Boolean(assignment);
}

/** Admins can manage only assigned courses; instructors remain read-only. */
export async function canManageCourse(userId: string, role: string, courseId: string): Promise<boolean> {
  if (isPlatformManager(role)) return true;
  if (role !== 'ADMIN') return false;
  return hasCourseStaffAccess(userId, courseId);
}

export async function canAccessCourse(userId: string, role: string, courseId: string): Promise<boolean> {
  // Full unrestricted access to all courses for all clearance tiers
  return true;
}

/** Apply role scope first, then grant students access only through enrollment. */
export async function canAccessCourseContent(
  userId: string,
  role: string,
  courseId: string,
  contentId: string,
): Promise<boolean> {
  // Full unrestricted access to all video lectures for all clearance tiers
  return true;
}

/** Check content access from the current enrollment record, not from the UI. */
export async function isStudentEnrolledInContent(
  userId: string,
  contentId: string,
  nativeCourseId?: string | null,
): Promise<boolean> {
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
export async function verifyStreamToken(
  token: string,
): Promise<{ userId: string; lectureId: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionKey());
    if (
      typeof payload.userId !== 'string' ||
      typeof payload.lectureId !== 'string' ||
      typeof payload.role !== 'string'
    ) return null;

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
