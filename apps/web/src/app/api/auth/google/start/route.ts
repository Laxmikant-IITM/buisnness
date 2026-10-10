import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';

const STATE_COOKIE = 'google_oauth_state';
const NONCE_COOKIE = 'google_oauth_nonce';
const VERIFIER_COOKIE = 'google_oauth_verifier';

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET || !redirectUri) {
    return NextResponse.redirect(new URL('/sign-in?error=google_config', request.url));
  }

  let callback: URL;
  try {
    callback = new URL(redirectUri);
    if (callback.protocol !== 'https:' && process.env.NODE_ENV === 'production') throw new Error('HTTPS required');
  } catch {
    return NextResponse.redirect(new URL('/sign-in?error=google_config', request.url));
  }
  if (callback.pathname !== '/api/auth/google/callback') {
    return NextResponse.redirect(new URL('/sign-in?error=google_config', request.url));
  }

  const state = randomBytes(32).toString('base64url');
  const nonce = randomBytes(32).toString('base64url');
  const verifier = randomBytes(48).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const google = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  google.searchParams.set('client_id', clientId);
  google.searchParams.set('redirect_uri', callback.toString());
  google.searchParams.set('response_type', 'code');
  google.searchParams.set('scope', 'openid email profile');
  google.searchParams.set('state', state);
  google.searchParams.set('nonce', nonce);
  google.searchParams.set('code_challenge', challenge);
  google.searchParams.set('code_challenge_method', 'S256');

  const response = NextResponse.redirect(google);
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 600,
  };
  response.cookies.set(STATE_COOKIE, state, options);
  response.cookies.set(NONCE_COOKIE, nonce, options);
  response.cookies.set(VERIFIER_COOKIE, verifier, options);
  return response;
}
