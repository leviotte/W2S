// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './src/lib/auth/session.server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const session = await getSession(req);
  const loggedIn = !!session.user;

  const protectedRoutes = ['/dashboard', '/admin'];

  if (protectedRoutes.some(r => pathname.startsWith(r)) && !loggedIn) {
    return NextResponse.redirect(new URL('/?auth=login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
