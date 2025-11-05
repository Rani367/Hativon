import { NextRequest, NextResponse } from 'next/server';
import * as cookie from 'cookie';

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = cookie.parse(cookieHeader);

  const isAuthenticated = cookies.authToken === 'authenticated';

  return NextResponse.json({ authenticated: isAuthenticated });
}
