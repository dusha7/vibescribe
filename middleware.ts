import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req?.nextUrl ?? {};
        // Allow public routes
        if (
          pathname === '/' ||
          pathname?.startsWith('/login') ||
          pathname?.startsWith('/api/auth') ||
          pathname?.startsWith('/api/signup') ||
          pathname?.startsWith('/api/demo') ||
          pathname?.startsWith('/api/referral') ||
          pathname?.startsWith('/api/forgot-password') ||
          pathname?.startsWith('/api/reset-password') ||
          pathname?.startsWith('/reset-password') ||
          pathname?.startsWith('/_next') ||
          pathname?.startsWith('/favicon') ||
          pathname?.startsWith('/og-image') ||
          pathname === '/robots.txt' ||
          pathname === '/sitemap.xml'
        ) {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.svg|og-image.png).*)'],
};
