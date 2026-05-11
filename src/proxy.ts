import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/login');
  const isApiAuthRoute = req.nextUrl.pathname.startsWith('/api/auth');
  const isDashboardRoute = req.nextUrl.pathname.startsWith('/dashboard');

  if (isApiAuthRoute) return NextResponse.next();

  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    if (isDashboardRoute) {
      return NextResponse.redirect(new URL('/login', req.nextUrl));
    }
    if (req.nextUrl.pathname.startsWith('/api') && !isApiAuthRoute) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
  }

  // Moderator Role Protection
  const userRole = (req.auth?.user as any)?.role;
  if (userRole === 'MODERATOR') {
    const restrictedRoutes = [
      '/dashboard/servers',
      '/dashboard/users',
      '/dashboard/settings',
    ];

    if (restrictedRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    }
  }

  // User Role Protection (Basic User)
  if (userRole === 'USER') {
    if (isDashboardRoute && req.nextUrl.pathname !== '/dashboard') {
        return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
