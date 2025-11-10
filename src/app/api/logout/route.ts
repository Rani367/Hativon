import { NextResponse } from 'next/server';
import * as cookie from 'cookie';

export async function POST() {
  try {
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
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
