import { NextResponse, type NextRequest } from 'next/server'
import { STAFF_SESSION_COOKIE } from '@/lib/session-cookie'

// Renamed from `middleware.ts` in Next.js 16 — see node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
//
// Optimistic check only: presence of the session cookie, not cryptographic verification (that's
// src/lib/dal.ts's job on every admin page). Staff sign in with a PIN rather than Supabase Auth,
// so there's no Supabase session to inspect here anymore.
export function proxy(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === '/admin'
  const hasSession = Boolean(request.cookies.get(STAFF_SESSION_COOKIE)?.value)

  if (!isLoginPage && !hasSession) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
