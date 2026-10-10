import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const redirectTo = new URL('/api/auth/google/callback', request.url).toString();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error || !data.url) throw error ?? new Error('Supabase did not return a Google sign-in URL.');
    return NextResponse.redirect(data.url);
  } catch (error) {
    console.error('Supabase Google sign-in could not start', error);
    return NextResponse.redirect(new URL('/sign-in?error=google_config', request.url));
  }
}
