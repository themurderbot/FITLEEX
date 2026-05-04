import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes — anyone can access
  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/trainers') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/api/webhooks')

  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user) {
    // Read role from JWT metadata (set at signup) — avoids a DB round-trip on every request
    const role =
      (user.user_metadata?.role as string | undefined) ??
      (user.app_metadata?.role as string | undefined)

    // Redirect authenticated users away from auth pages
    if (pathname.startsWith('/auth/') && pathname !== '/auth/callback') {
      const dest = request.nextUrl.clone()
      dest.pathname = role === 'admin'      ? '/admin/overview'
                    : role === 'trainer'    ? '/trainer/dashboard'
                    : role === 'subscriber' ? '/dashboard'
                    : '/'   // role unknown in JWT → landing page (layout will handle proper check)
      return NextResponse.redirect(dest)
    }

    // Role-based route guards — only block if role is explicitly a different role
    // (if role is missing from JWT, let layout/page handle the DB check)
    if (pathname.startsWith('/admin') && role && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    if (pathname.startsWith('/trainer') && role && role !== 'trainer') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    if ((pathname.startsWith('/dashboard') || pathname.startsWith('/subscriber')) && role && role !== 'subscriber') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}
