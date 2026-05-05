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

  // Refresh session — critical: must use getUser() not getSession()
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Helper: redirect while copying session cookies so they're not lost
  function redirectTo(dest: string, keepSearch = false) {
    const url = request.nextUrl.clone()
    url.pathname = dest
    if (!keepSearch) url.search = ''
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(c => res.cookies.set(c))
    return res
  }

  if (user) {
    const role =
      (user.user_metadata?.role as string | undefined) ??
      (user.app_metadata?.role as string | undefined)

    // Root → send to dashboard (DB-based role check happens in /dashboard/page.tsx)
    if (pathname === '/') {
      return redirectTo('/dashboard')
    }

    // Auth pages → dashboard
    if (pathname.startsWith('/auth/') && pathname !== '/auth/callback') {
      return redirectTo('/dashboard')
    }

    // Everything else: let layout/page do the DB-based role check
    return supabaseResponse
  }

  // Not logged in — only allow public routes
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

  return supabaseResponse
}
