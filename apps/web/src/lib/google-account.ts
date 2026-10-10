import { prisma } from '@/lib/db';
import { GOOGLE_EMAIL_ROLES, roleForVerifiedGoogleEmail } from '@/lib/auth';

/** Provision the LMS account only after Supabase has verified a Google identity. */
export async function provisionGoogleAccount(user: {
  email: string;
  name?: string | null;
}) {
  const email = user.email.trim().toLowerCase();
  const assignedRole = GOOGLE_EMAIL_ROLES[email];
  const accountName = user.name?.trim()
    ? user.name.trim().slice(0, 120)
    : email.split('@')[0];

  return prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email } });
    if (!existing) {
      return tx.user.create({
        data: { email, name: accountName, role: roleForVerifiedGoogleEmail(email), isActive: true },
        select: { id: true, email: true, name: true, role: true, isActive: true, tokenVersion: true },
      });
    }

    const roleChanged = Boolean(assignedRole && existing.role !== assignedRole);
    return tx.user.update({
      where: { id: existing.id },
      data: {
        ...(assignedRole ? { role: assignedRole } : {}),
        ...(!existing.name.trim() ? { name: accountName } : {}),
        ...(roleChanged ? { tokenVersion: { increment: 1 } } : {}),
      },
      select: { id: true, email: true, name: true, role: true, isActive: true, tokenVersion: true },
    });
  });
}
