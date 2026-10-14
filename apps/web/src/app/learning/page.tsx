/**
 * @file apps/web/src/app/learning/page.tsx
 * @description Unified Dashboard Redirect.
 *
 * Directs all learning traffic to the unified /dashboard route, ensuring
 * a single, consistent dashboard experience across all student and managerial roles.
 */

import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LearningRedirectPage() {
  redirect('/dashboard');
}
