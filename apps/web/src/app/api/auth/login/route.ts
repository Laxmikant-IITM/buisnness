import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createSessionToken, GOOGLE_EMAIL_ROLES } from '@/lib/auth';
import { prisma } from '@/lib/db';

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

/** Authenticate against the new product's own account table and issue an HttpOnly session. */
export async function POST(request: Request) {
  const parsed = credentialsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid email and password.' }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  let user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, passwordHash: true, role: true, isActive: true, tokenVersion: true },
  });
  // A single generic response avoids revealing whether an email has an account.
  const validPassword = user?.passwordHash
    ? await bcrypt.compare(parsed.data.password, user.passwordHash)
    : false;
  if (!user || !user.isActive || !validPassword) {
    return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 });
  }

  // Keep the explicitly assigned platform accounts consistent across login methods.
  const assignedRole = GOOGLE_EMAIL_ROLES[email];
  if (assignedRole && user.role !== assignedRole) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: assignedRole, tokenVersion: { increment: 1 } },
      select: { id: true, email: true, name: true, passwordHash: true, role: true, isActive: true, tokenVersion: true },
    });
  }

  const token = await createSessionToken({ userId: user.id, email: user.email, role: user.role }, user.tokenVersion);
  const response = NextResponse.json({ success: true, role: user.role });
  response.cookies.set('lms_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
