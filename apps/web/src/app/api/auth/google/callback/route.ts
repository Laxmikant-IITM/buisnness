import { NextResponse } from 'next/server';
import { createSessionToken, roleForVerifiedGoogleEmail, GOOGLE_EMAIL_ROLES } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

function signInError(request: Request) {
  return NextResponse.redirect(new URL('/sign-in?error=google', request.url));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (!code) return signInError(request);

  try {
    const supabase = await createSupabaseServerClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) return signInError(request);

    // getUser() verifies the session with Supabase Auth rather than trusting browser-supplied identity data.
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const email = user?.email?.trim().toLowerCase();
    const hasGoogleIdentity = user?.identities?.some((identity) => identity.provider === 'google');
    if (
      userError ||
      !user ||
      (!hasGoogleIdentity && user.app_metadata.provider !== 'google') ||
      !user.email_confirmed_at ||
      !email
    ) return signInError(request);

    const assignedRole = GOOGLE_EMAIL_ROLES[email];
    const metadata = user.user_metadata as Record<string, unknown> | undefined;
    const profileName = metadata?.full_name ?? metadata?.name;
    const accountName = typeof profileName === 'string' && profileName.trim()
      ? profileName.trim().slice(0, 120)
      : email.split('@')[0];

    const account = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { email } });
      if (!existing) {
        return tx.user.create({
          data: { email, name: accountName, role: roleForVerifiedGoogleEmail(email), isActive: true },
          select: { id: true, email: true, role: true, isActive: true, tokenVersion: true },
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
        select: { id: true, email: true, role: true, isActive: true, tokenVersion: true },
      });
    });

    // This app uses its own short-lived HttpOnly session after Supabase verifies the identity.
    await supabase.auth.signOut({ scope: 'local' });
    if (!account.isActive) return signInError(request);

    const token = await createSessionToken(
      { userId: account.id, email: account.email, role: account.role },
      account.tokenVersion,
    );
    const response = NextResponse.redirect(new URL(account.role === 'STUDENT' ? '/learning' : '/manager', request.url));
    response.cookies.set('lms_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    console.error('Supabase Google sign-in failed', error);
    return signInError(request);
  }
}
