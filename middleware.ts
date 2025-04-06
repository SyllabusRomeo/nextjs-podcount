import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  // Skip middleware for static files and public assets
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.startsWith('/public') ||
    request.nextUrl.pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const isAuthenticated = !!token;
    const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                      request.nextUrl.pathname.startsWith('/register');
    const isApiAuthRoute = request.nextUrl.pathname.startsWith('/api/auth');

    // Allow public routes
    if (isApiAuthRoute || request.nextUrl.pathname === '/') {
      return NextResponse.next();
    }

    // Redirect authenticated users away from auth pages
    if (isAuthenticated && isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Redirect unauthenticated users to login page
    if (!isAuthenticated && !isAuthPage) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api/auth/* (authentication API routes)
     * 2. /_next/* (Next.js internals)
     * 3. /static/* (static files)
     * 4. /favicon.ico, /robots.txt (public files)
     */
    '/((?!api/auth|_next|static|favicon.ico|robots.txt).*)',
  ],
}; 