import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Extend the token type to include role
interface TokenWithRole {
  role?: string;
  id?: string;
  email?: string;
}

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token as TokenWithRole | null;
    const path = req.nextUrl.pathname;

    // If user is admin and trying to access dashboard, redirect to admin
    if (path === '/dashboard' && token?.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    // If user is not admin and trying to access admin routes, redirect to dashboard
    if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        const publicPaths = ['/', '/login', '/register', '/tools', '/features', '/reviews', '/faq', '/verify-otp', '/forgot-password', '/reset-password'];
        if (publicPaths.includes(req.nextUrl.pathname)) {
          return true;
        }

        // Require authentication for protected routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/checkout/:path*',
    '/payment/:path*',
  ],
};
