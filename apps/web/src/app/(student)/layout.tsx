/**
 * Student Domain Layout Component
 * Module: Student Layout (src/app/(student)/layout.tsx)
 *
 * Wraps student-facing modules (Community, Live Classes, Calendar, Homework, Support, Tools)
 * in the unified responsive AppShell with dark sidebar and application header.
 */

import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  let headerUser:
    | {
        name: string;
        email: string;
        avatar?: string;
        role?: string;
      }
    | undefined = undefined;

  if (session) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { name: true, email: true, avatar: true, role: true },
      });

      if (user) {
        headerUser = {
          name: user.name,
          email: user.email,
          avatar: user.avatar || undefined,
          role: user.role,
        };
      }
    } catch {
      // Non-fatal if DB is unseeded or offline
    }

    if (!headerUser) {
      headerUser = {
        name: session.email.split('@')[0],
        email: session.email,
        role: session.role,
      };
    }
  }

  return (
    <AppShell user={headerUser}>
      {children}
    </AppShell>
  );
}
