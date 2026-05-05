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

  // IMPORTANT: always call getUser() — it refreshes the session token via Supabase servers
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Helper: redirect while preserving session cookies
  function redirectTo(dest: string) {
    const url = request.nextUrl.clone()
    url.pathname = dest
    url.search = ''
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(c => res.cookies.set(c))
    return res
  }

  // ── Logged-in user ─────────────────────────────────────────────────────────
  if (user) {
    const role =
      (user.user_metadata?.role as string | undefined) ??
      (user.app_metadata?.role as string | undefined)

    const dashboardFor = (r: string | undefined) =>
      r === 'admin'      ? '/admin/overview'      :
      r === 'trainer'    ? '/trainer/dashboard'   :
      r === 'subscriber' ? '/subscriber/dashboard':
      '/dashboard'  // DB-based role check in /dashboard/page.tsx

    // Landing page — redirect to dashboard
    if (pathname === '/') return redirectTo(dashboardFor(role))

    // Auth pages — redirect to dashboard
    if (pathname.startsWith('/auth/') && pathname !== '/auth/callback') {
      return redirectTo(dashboardFor(role))
    }

    // Wrong role → home (layout will handle it)
    if (role) {
      if (pathname.startsWith('/admin')      && role !== 'admin')      return redirectTo('/')
      if (pathname.startsWith('/trainer')    && role !== 'trainer')    return redirectTo('/')
      if ((pathname.startsWith('/subscriber') || pathname.startsWith('/dashboard')) && role !== 'subscriber') {
        return redirectTo('/')
      }
    }
  }

  // ── Logged-out user ────────────────────────────────────────────────────────
  if (!user) {
    const isPublic =
      pathname === '/' ||
      pathname.startsWith('/trainers') ||
      pathname.startsWith('/auth/') ||
      pathname.startsWith('/checkout') ||
      pathname.startsWith('/api/webhooks')

    if (!isPublic) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('next', pathname)
      const res = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach(c => res.cookies.set(c))
      return res
    }
  }

  return supabaseResponse
}
