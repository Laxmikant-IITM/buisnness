import { timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { createSessionToken, roleForVerifiedGoogleEmail, GOOGLE_EMAIL_ROLES } from '@/lib/auth';
import { prisma } from '@/lib/db';

const GOOGLE_KEYS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const STATE_COOKIE = 'google_oauth_state';
const NONCE_COOKIE = 'google_oauth_nonce';
const VERIFIER_COOKIE = 'google_oauth_verifier';

function matches(left: string | undefined, right: string | null) {
  if (!left || !right) return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function signInError(request: Request) {
  const response = NextResponse.redirect(new URL('/sign-in?error=google', request.url));
  for (const name of [STATE_COOKIE, NONCE_COOKIE, VERIFIER_COOKIE]) response.cookies.set(name, '', { path: '/', maxAge: 0 });
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const cookieStore = await cookies();
  if (!matches(cookieStore.get(STATE_COOKIE)?.value, url.searchParams.get('state')) || !code) {
    return signInError(request);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const verifier = cookieStore.get(VERIFIER_COOKIE)?.value;
  const nonce = cookieStore.get(NONCE_COOKIE)?.value;
  if (!clientId || !clientSecret || !redirectUri || !verifier || !nonce) return signInError(request);

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      cache: 'no-store',
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: verifier,
      }),
    });
    if (!tokenResponse.ok) return signInError(request);
    const tokenBody: unknown = await tokenResponse.json();
    if (!tokenBody || typeof tokenBody !== 'object' || !('id_token' in tokenBody) || typeof tokenBody.id_token !== 'string') {
      return signInError(request);
    }

    const { payload } = await jwtVerify(tokenBody.id_token, GOOGLE_KEYS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: clientId,
    });
    if (
      payload.nonce !== nonce ||
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      payload.email_verified !== true
    ) return signInError(request);

    const email = payload.email.trim().toLowerCase();
    const assignedRole = GOOGLE_EMAIL_ROLES[email];
    const accountName = typeof payload.name === 'string' && payload.name.trim()
      ? payload.name.trim().slice(0, 120)
      : email.split('@')[0];

    const user = await prisma.$transaction(async (tx) => {
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

    if (!user.isActive) return signInError(request);
    const token = await createSessionToken({ userId: user.id, email: user.email, role: user.role }, user.tokenVersion);
    const response = NextResponse.redirect(new URL(user.role === 'STUDENT' ? '/learning' : '/manager', request.url));
    response.cookies.set('lms_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    for (const name of [STATE_COOKIE, NONCE_COOKIE, VERIFIER_COOKIE]) response.cookies.set(name, '', { path: '/', maxAge: 0 });
    return response;
  } catch (error) {
    console.error('Google sign-in failed', error);
    return signInError(request);
  }
}
