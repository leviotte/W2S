import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from '@/lib/auth/session';

const publicRoutes = ['/', '/about', '/help', '/terms', '/blog', '/guides'];
const authRoutes = ['/login', '/register', '/reset-password'];
const protectedRoutes = ['/dashboard', '/wishlists', '/events'];
const adminRoutes = ['/admin-dashboard', '/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get session
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  const isLoggedIn = session.isLoggedIn && !!session.user;
  const isAdmin = session.user?.isAdmin === true;

  // Admin routes
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protected routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isLoggedIn) {
      const url = new URL('/', request.url);
      url.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Auth routes
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (isLoggedIn) {
      const redirectTo = isAdmin ? '/admin-dashboard' : '/dashboard';
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};