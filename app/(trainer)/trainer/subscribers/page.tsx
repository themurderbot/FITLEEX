import { redirect }        from 'next/navigation'
import Link                 from 'next/link'
import { createClient }     from '@/lib/supabase/server'
import { getLocale }        from 'next-intl/server'

export const metadata = { title: 'Subscribers' }

const AV_COLORS = [
  'linear-gradient(135deg,#C8F04B,#7ab82e)',
  'linear-gradient(135deg,#60a5fa,#3b82f6)',
  'linear-gradient(135deg,#FF5A36,#cc3d20)',
  'linear-gradient(135deg,#a78bfa,#7c3aed)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
]

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function pill(status: string, locale: string) {
  const map: Record<string, { label: string; labelAr: string; color: string; bg: string }> = {
    active:   { label: 'Active',    labelAr: 'نشط',         color: '#4CAF50', bg: 'rgba(76,175,80,0.15)' },
    expiring: { label: 'Expiring',  labelAr: 'ينتهي قريباً', color: '#FF8C42', bg: 'rgba(255,140,66,0.15)' },
    expired:  { label: 'Expired',   labelAr: 'منتهي',        color: '#888',    bg: 'rgba(136,136,136,0.12)' },
    pending:  { label: 'New',       labelAr: 'جديد',         color: '#4D9EFF', bg: 'rgba(77,158,255,0.15)' },
  }
  const p = map[status] ?? map.active
  return { ...p, text: locale === 'ar' ? p.labelAr : p.label }
}

interface PageProps { searchParams: Promise<{ status?: string; q?: string }> }

export default async function SubscribersPage({ searchParams }: PageProps) {
  const { status, q } = await searchParams
  const locale  = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await (supabase as any).auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: trainer } = await (supabase as any)
    .from('trainers').select('id').eq('profile_id', user.id).single()
  if (!trainer) redirect('/')

  let query = (supabase as any)
    .from('subscriptions')
    .select('id, subscriber_id, status, start_date, end_date, profiles!subscriber_id(full_name, avatar_url), trainer_plans(name, duration_days)')
    .eq('trainer_id', (trainer as any).id)
    .order('created_at', { ascending: false })

  if (status && status !== 'all') query = query.eq('status', status)

  const { data: raw } = await query
  const subs = ((raw ?? []) as any[]).filter((s: any) =>
    !q || s.profiles?.full_name?.toLowerCase().includes(q.toLowerCase())
  )

  const now = Date.now()

  const tabs = [
    { key: 'all',      labelEn: 'All',      labelAr: 'الكل' },
    { key: 'active',   labelEn: 'Active',   labelAr: 'نشط' },
    { key: 'expiring', labelEn: 'Expiring', labelAr: 'ينتهي' },
    { key: 'expired',  labelEn: 'Expired',  labelAr: 'منتهي' },
  ]

  const th = (en: string, ar: string) => (
    <th className="text-start py-3 px-4 font-medium text-[10px] tracking-[2px] uppercase"
      style={{ color: '#444' }}>
      {locale === 'ar' ? ar : en}
    </th>
  )

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-extrabold text-white">
          {locale === 'ar' ? 'المشتركون' : 'Subscribers'}
        </h1>
        <p className="text-[11px] font-mono mt-0.5" style={{ color: '#555' }}>
          {locale === 'ar' ? `${subs.length} عميل نشط` : `${subs.length} active clients`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form className="relative flex-1">
          <svg className="absolute top-1/2 -translate-y-1/2 text-muted" style={{ left: 12 }}
            width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx={11} cy={11} r={8}/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input name="q" defaultValue={q}
            placeholder={locale === 'ar' ? 'ابحث بالاسم...' : 'Search by name...'}
            className="input w-full" style={{ paddingLeft: 36 }} />
          {status && <input type="hidden" name="status" value={status} />}
        </form>

        <div className="flex gap-1 rounded-lg p-1" style={{ background: '#161616', border: '1px solid #222' }}>
          {tabs.map(tab => (
            <Link key={tab.key}
              href={`/trainer/subscribers?status=${tab.key}${q ? `&q=${q}` : ''}`}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
              style={(status ?? 'all') === tab.key
                ? { background: '#C8F04B', color: '#000' }
                : { color: '#666' }}>
              {locale === 'ar' ? tab.labelAr : tab.labelEn}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-x-auto" style={{ border: '1px solid #222', background: '#141414' }}>
        {!subs.length ? (
          <div className="py-16 text-center text-sm" style={{ color: '#555' }}>
            {locale === 'ar' ? 'لا يوجد مشتركون' : 'No subscribers yet'}
          </div>
        ) : (
          <table className="w-full text-sm" style={{ minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #222' }}>
                {th('Subscriber', 'المشترك')}
                {th('Plan', 'الخطة')}
                {th('Start', 'البداية')}
                {th('Progress', 'التقدم')}
                {th('Status', 'الحالة')}
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {subs.map((sub, idx) => {
                const profile   = (sub.profiles as any) ?? {}
                const plan      = (sub.trainer_plans as any) ?? {}
                const daysIn    = sub.start_date
                  ? Math.max(0, Math.floor((now - new Date(sub.start_date).getTime()) / 86400000))
                  : 0
                const totalDays = plan.duration_days ?? 30
                const pct       = Math.min(100, Math.round((daysIn / totalDays) * 100))
                const st        = sub.status ?? 'active'
                const p         = pill(st, locale)
                const startFmt  = sub.start_date
                  ? new Date(sub.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : '—'

                return (
                  <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom: '1px solid #1a1a1a' }}>
                    {/* Subscriber */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: AV_COLORS[idx % AV_COLORS.length],
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: 13, color: '#000',
                        }}>
                          {initials(profile.full_name ?? '?')}
                        </div>
                        <div>
                          <Link href={`/trainer/subscribers/${sub.subscriber_id}`}
                            className="font-semibold text-white hover:text-brand transition-colors text-sm">
                            {profile.full_name ?? '—'}
                          </Link>
                          <p className="text-[11px]" style={{ color: '#555' }}>{plan.name ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    {/* Plan */}
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="text-white text-sm">{plan.name ?? '—'}</span>
                      {totalDays && <span className="text-[11px] ms-1" style={{ color: '#555' }}>· {totalDays}d</span>}
                    </td>
                    {/* Start */}
                    <td className="py-3 px-4 hidden lg:table-cell text-xs font-mono" style={{ color: '#666' }}>
                      {startFmt}
                    </td>
                    {/* Progress */}
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div style={{ minWidth: 110 }}>
                        <span className="text-xs font-mono" style={{ color: p.color }}>
                          {locale === 'ar' ? `اليوم ${daysIn}/${totalDays}` : `Day ${daysIn}/${totalDays}`}
                        </span>
                        <div style={{ height: 3, borderRadius: 2, background: '#222', marginTop: 5 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: p.color, borderRadius: 2, transition: 'width .3s' }} />
                        </div>
                      </div>
                    </td>
                    {/* Status */}
                    <td className="py-3 px-4">
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: p.bg, color: p.color }}>
                        {p.text}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {st === 'expired' ? (
                          <Link href={`/trainer/subscribers/${sub.subscriber_id}`}
                            className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10"
                            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888' }}>
                            {locale === 'ar' ? 'السجل' : 'History'}
                          </Link>
                        ) : st === 'pending' ? (
                          <>
                            <Link href={`/trainer/subscribers/${sub.subscriber_id}`}
                              className="text-xs px-3 py-1.5 rounded-lg font-bold transition-opacity hover:opacity-80"
                              style={{ background: '#C8F04B', color: '#000' }}>
                              {locale === 'ar' ? 'بناء خطة' : 'Build Plan'}
                            </Link>
                            <Link href={`/trainer/chat?sub=${sub.subscriber_id}`}
                              className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10"
                              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888' }}>
                              {locale === 'ar' ? 'محادثة' : 'Chat'}
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link href={`/trainer/subscribers/${sub.subscriber_id}`}
                              className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10"
                              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc' }}>
                              {locale === 'ar' ? 'الخطة' : 'Plan'}
                            </Link>
                            <Link href={`/trainer/chat?sub=${sub.subscriber_id}`}
                              className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10"
                              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc' }}>
                              {locale === 'ar' ? 'محادثة' : 'Chat'}
                            </Link>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
