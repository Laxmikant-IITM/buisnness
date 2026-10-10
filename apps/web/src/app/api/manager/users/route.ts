import { NextResponse } from 'next/server';
import { getSession, isPlatformManager, GOOGLE_EMAIL_ROLES } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in to manage users.' }, { status: 401 });
  if (!isPlatformManager(session.role)) return NextResponse.json({ error: 'Only managers can manage user roles.' }, { status: 403 });

  const users = await prisma.user.findMany({
    orderBy: [{ createdAt: 'desc' }],
    take: 500,
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });
  return NextResponse.json({ role: session.role, users: users.map((user) => ({
    ...user,
    protectedRole: Object.hasOwn(GOOGLE_EMAIL_ROLES, user.email.toLowerCase()),
  })) });
}
