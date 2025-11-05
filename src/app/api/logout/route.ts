import { NextResponse } from 'next/server';
import * as cookie from 'cookie';

export async function POST() {
  const authCookie = cookie.serialize('authToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0, // Expire immediately
    sameSite: 'strict',
    path: '/',
  });

  const response = NextResponse.json({ success: true });
  response.headers.set('Set-Cookie', authCookie);

  return response;
}
