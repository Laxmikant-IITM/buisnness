import { NextResponse } from 'next/server';

/** Clearing the HttpOnly cookie ends this browser session; account token revocation remains separate. */
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('lms_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
