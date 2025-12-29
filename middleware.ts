import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';

const publicRoutes = ['/', '/about', '/help', '/terms', '/blog', '/guides', '/post', '/search'];
const authRoutes = ['/login', '/register', '/reset-password'];
const protectedRoutes = ['/dashboard', '/wishlists', '/events'];
const adminRoutes = ['/admin'];

// Belangrijk! Type guard zodat TS weet dat je extra velden mag aanspreken
function isAuthenticatedSessionUser(
  user: unknown
): user is { isLoggedIn: true; isAdmin?: boolean } {
  return typeof user === 'object' && user !== null && (user as any).isLoggedIn === true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public routes, API, static files
  if (
    publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`)) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Haal session binnen
  const session = await getSession();
  const user = session.user;

  // Type guards: clean én strict!
  const isLoggedIn = user.isLoggedIn === true;
  const isAdmin = isAuthenticatedSessionUser(user) && user.isAdmin === true;

  // Admin routes
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/?auth=login', request.url));
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
      url.searchParams.set('auth', 'login');
      url.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Auth routes (redirect if already logged in)
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (isLoggedIn) {
      const redirectTo = isAdmin ? '/admin' : '/dashboard';
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Matcher fix/optie:
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};