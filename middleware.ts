// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get('wish2share_session')?.value;
  const loggedIn = !!raw;

  if (pathname.startsWith('/dashboard') && !loggedIn) {
    return NextResponse.redirect(new URL('/?auth=login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
