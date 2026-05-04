import { NextResponse }      from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const revalidate = 3600  // regenerate every hour

export async function GET() {
  const supabase  = await createAdminClient()
  const APP_URL   = process.env.NEXT_PUBLIC_APP_URL ?? 'https://FITLEEX.app'

  const { data: trainers } = await (supabase as any)
    .from('trainers')
    .select('id, updated_at')
    .eq('approval_status', 'approved')

  const staticPages = ['', '/trainers', '/auth/login', '/auth/signup']

  const urls = [
    ...staticPages.map(path => `
  <url>
    <loc>${APP_URL}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === '' ? '1.0' : '0.8'}</priority>
  </url>`),
    ...(trainers ?? []).map(t => `
  <url>
    <loc>${APP_URL}/trainers/${t.id}</loc>
    <lastmod>${t.updated_at?.split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type':  'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
