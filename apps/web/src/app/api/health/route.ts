import { NextResponse } from 'next/server';

/** Lightweight deployment probe; it exposes no configuration or user data. */
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'lms-web' });
}
