import { NextResponse } from 'next/server';
import { createSessionToken } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { provisionGoogleAccount } from '@/lib/google-account';

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

    const metadata = user.user_metadata as Record<string, unknown> | undefined;
    const profileName = metadata?.full_name ?? metadata?.name;
    const account = await provisionGoogleAccount({
      email,
      name: typeof profileName === 'string' ? profileName : null,
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
