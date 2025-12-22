// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from '@/lib/auth/session';

const publicRoutes = ['/', '/about', '/help', '/terms', '/blog', '/guides', '/post', '/search'];
const authRoutes = ['/login', '/register', '/reset-password'];
const protectedRoutes = ['/dashboard', '/wishlists', '/events'];
const adminRoutes = ['/admin']; // ✅ FIXED: /admin ipv /admin-dashboard

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes, API routes, and static files
  if (
    publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`)) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get session (let op: géén await bij cookies!)
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  const isLoggedIn = session.isLoggedIn && !!session.user;
  const isAdmin = session.user?.isAdmin === true;

  // Admin routes check
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/?auth=login', request.url));
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protected routes check
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isLoggedIn) {
      const url = new URL('/', request.url);
      url.searchParams.set('auth', 'login');
      url.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Auth routes (redirect if already logged in)
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (isLoggedIn) {
      const redirectTo = isAdmin ? '/admin' : '/dashboard'; // ✅ FIXED
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Gebruik de correcte export-structuur voor matcher:
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};