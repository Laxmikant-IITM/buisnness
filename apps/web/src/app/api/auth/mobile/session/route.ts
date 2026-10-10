import { NextResponse } from 'next/server';
import { createSessionToken } from '@/lib/auth';
import { provisionGoogleAccount } from '@/lib/google-account';

/** Exchange a Supabase Google session for the LMS bearer session used by APIs. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accessToken = typeof body?.accessToken === 'string' ? body.accessToken : '';
    if (!accessToken || accessToken.length > 8192) {
      return NextResponse.json({ error: 'Your Google session is missing or expired.' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !publishableKey) {
      return NextResponse.json({ error: 'Sign-in is temporarily unavailable.' }, { status: 503 });
    }

    const verifiedResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });
    if (!verifiedResponse.ok) {
      return NextResponse.json({ error: 'Your Google session expired. Please sign in again.' }, { status: 401 });
    }

    const verifiedUser = await verifiedResponse.json();
    const email = typeof verifiedUser.email === 'string' ? verifiedUser.email.trim().toLowerCase() : '';
    const hasGoogleIdentity = Array.isArray(verifiedUser.identities)
      && verifiedUser.identities.some((identity: { provider?: string }) => identity?.provider === 'google');
    if (
      !email ||
      (!hasGoogleIdentity && verifiedUser.app_metadata?.provider !== 'google') ||
      !verifiedUser.email_confirmed_at
    ) {
      return NextResponse.json({ error: 'Use a verified Google account to sign in.' }, { status: 401 });
    }

    const metadata = verifiedUser.user_metadata as Record<string, unknown> | undefined;
    const profileName = metadata?.full_name ?? metadata?.name;
    const account = await provisionGoogleAccount({
      email,
      name: typeof profileName === 'string' ? profileName : null,
    });
    if (!account.isActive) {
      return NextResponse.json({ error: 'This account is currently inactive.' }, { status: 403 });
    }

    const token = await createSessionToken(
      { userId: account.id, email: account.email, role: account.role },
      account.tokenVersion,
    );
    return NextResponse.json({
      token,
      user: { id: account.id, email: account.email, name: account.name, role: account.role },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Mobile Google session exchange failed:', error);
    return NextResponse.json({ error: 'Sign-in is temporarily unavailable.' }, { status: 503 });
  }
}
