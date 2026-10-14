/**
 * @file apps/web/src/app/manager/layout.tsx
 * @description Unified Manager Domain Layout.
 *
 * Ensures all managerial suites (/manager, /manager/courses, /manager/exams, /manager/users)
 * share the EXACT same visual layout, sidebar, and header as the primary application.
 */

import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { getFullSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getFullSession();

  if (!user) {
    redirect('/sign-in');
  }

  // Student roles are barred from /manager suite
  if (user.role === 'STUDENT') {
    redirect('/dashboard');
  }

  const headerUser = {
    name: user.name,
    email: user.email,
    avatar: user.avatar || undefined,
    role: user.role,
  };

  return (
    <AppShell user={headerUser}>
      {children}
    </AppShell>
  );
}
