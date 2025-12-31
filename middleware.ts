// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Edge-safe session check
  const sessionCookie = req.cookies.get('wish2share_session')?.value;
  const loggedIn = !!sessionCookie; // TODO: optioneel decode/verify JWT edge-compatible

  const protectedRoutes = ['/dashboard', '/admin'];
  if (protectedRoutes.some(r => pathname.startsWith(r)) && !loggedIn) {
    return NextResponse.redirect(new URL('/?auth=login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
