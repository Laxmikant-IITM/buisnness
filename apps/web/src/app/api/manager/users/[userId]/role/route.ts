import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession, isPlatformManager, GOOGLE_EMAIL_ROLES } from '@/lib/auth';
import { prisma } from '@/lib/db';

const roleSchema = z.object({ role: z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN', 'MANAGER', 'SUPER_MANAGER']) });

export async function PATCH(request: Request, context: { params: { userId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in to change user roles.' }, { status: 401 });
  if (!isPlatformManager(session.role)) return NextResponse.json({ error: 'Only managers can change user roles.' }, { status: 403 });

  const parsed = roleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Choose a valid role.' }, { status: 400 });
  if (context.params.userId === session.userId) return NextResponse.json({ error: 'You cannot change your own role.' }, { status: 400 });
  if (session.role === 'MANAGER' && ['MANAGER', 'SUPER_MANAGER'].includes(parsed.data.role)) {
    return NextResponse.json({ error: 'Managers can assign student, instructor, and admin roles. Only a super manager can assign platform manager roles.' }, { status: 403 });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({ where: { id: context.params.userId } });
      if (!target) return null;
      if (Object.hasOwn(GOOGLE_EMAIL_ROLES, target.email.toLowerCase())) {
        throw new Error('This account has a role assigned to its verified Google email and cannot be changed here.');
      }
      if (target.role === 'SUPER_MANAGER' && parsed.data.role !== 'SUPER_MANAGER') {
        const activeSuperManagers = await tx.user.count({ where: { role: 'SUPER_MANAGER', isActive: true } });
        if (activeSuperManagers <= 1) throw new Error('The last active super manager cannot be demoted.');
      }
      if (target.role === parsed.data.role) return target;

      const user = await tx.user.update({
        where: { id: target.id },
        data: { role: parsed.data.role, tokenVersion: { increment: 1 } },
      });
      await tx.activityLog.create({
        data: {
          userId: session.userId,
          action: 'USER_ROLE_CHANGED',
          entity: 'User',
          entityId: target.id,
          details: { email: target.email, from: target.role, to: parsed.data.role },
        },
      });
      return user;
    });
    if (!updated) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    return NextResponse.json({ success: true, role: updated.role });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The user role could not be changed.';
    if (message.startsWith('This account') || message.startsWith('The last active')) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    console.error('User role update failed', error);
    return NextResponse.json({ error: 'The user role could not be changed.' }, { status: 500 });
  }
}
