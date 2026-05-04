import { redirect }        from 'next/navigation'
import Link                 from 'next/link'
import { createClient }     from '@/lib/supabase/server'
import { getTranslations }  from 'next-intl/server'
import { RevenueChart }     from '@/components/trainer/RevenueChart'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { ArrowRight }       from 'lucide-react'

function greeting(name: string, locale: string): string {
  const h = new Date().getHours()
  if (locale === 'ar') {
    const part = h < 12 ? 'صباح الخير' : h < 17 ? 'مساء الخير' : 'مساء النور'
    return `${part}، ${name.split(' ')[0]} 👋`
  }
  const part = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'
  return `${part}, ${name.split(' ')[0]} 👋`
}

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

export const metadata = { title: 'Dashboard' }

export default async function TrainerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const t = await getTranslations('trainerDash')

  const [{ data: profile }, { data: trainer }] = await Promise.all([
    (supabase as any).from('profiles').select('full_name, language').eq('id', user.id).single(),
    (supabase as any).from('trainers').select('id, rating, subscribers_count, commission_rate').eq('profile_id', user.id).single(),
  ])

  if (!trainer) redirect('/')
  const locale = ((profile as any)?.language ?? 'en') as string

  const { data: trainerSubs } = await (supabase as any)
    .from('subscriptions')
    .select('id')
    .eq('trainer_id', (trainer as any).id)

  const subIds = ((trainerSubs ?? []) as any[]).map((s: any) => s.id)

  const [
    { data: subscriptions },
    { data: payments },
    { count: pendingReviews },
  ] = await Promise.all([
    (supabase as any)
      .from('subscriptions')
      .select('id, subscriber_id, status, start_date, end_date, profiles!subscriber_id(full_name, avatar_url), trainer_plans(name, duration_days)')
      .eq('trainer_id', (trainer as any).id)
      .in('status', ['active', 'expiring'])
      .order('end_date', { ascending: true })
      .limit(5),

    subIds.length > 0
      ? (supabase as any)
          .from('payments')
          .select('amount, created_at')
          .eq('status', 'completed')
          .in('subscription_id', subIds)
      : Promise.resolve({ data: [] as { amount: number; created_at: string }[], error: null }),

    subIds.length > 0
      ? (supabase as any)
          .from('progress_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('reviewed', false)
          .in('subscription_id', subIds)
      : Promise.resolve({ count: 0, data: null, error: null }),
  ])

  const grossRevenue   = payments?.reduce((s, p) => s + p.amount, 0) ?? 0
  const trainerRevenue = grossRevenue * trainer.commission_rate

  const monthlyMap: Record<string, number> = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthlyMap[d.toLocaleString('en-US', { month: 'short' })] = 0
  }
  payments?.forEach(p => {
    const key = new Date(p.created_at).toLocaleString('en-US', { month: 'short' })
    if (key in monthlyMap) monthlyMap[key] += p.amount * trainer.commission_rate
  })
  const chartData = Object.entries(monthlyMap).map(([month, revenue]) => ({
    month, revenue: Math.round(revenue),
  }))

  const remainingSlots = Math.max(0, 140 - (trainer.subscribers_count ?? 0))
  const pending        = pendingReviews ?? 0

  const stats = [
    {
      label: t('metricSubscribers'),
      value: formatNumber(trainer.subscribers_count ?? 0),
      sub:   t('subSlotsRemaining', { count: remainingSlots }),
      trend: 'up',
      trendLabel: '↑ +8',
      valueColor: '#C8F04B',
    },
    {
      label: t('metricEarnings'),
      value: formatNumber(Math.round(trainerRevenue)),
      sub:   t('subAedAfterFee'),
      trend: 'up',
      trendLabel: '↑ +12%',
      valueColor: '#C8F04B',
      small: true,
    },
    {
      label: t('metricRating'),
      value: trainer.rating ? trainer.rating.toFixed(1) : '—',
      sub:   t('subFromReviews'),
      trend: 'up',
      trendLabel: '★★★★★',
      valueColor: '#C8F04B',
    },
    {
      label: t('metricPending'),
      value: formatNumber(pending),
      sub:   t('subAwaitingReview'),
      trend: pending > 0 ? 'warn' : 'up',
      trendLabel: pending > 0 ? t('trendReviewNow') : t('trendUpToDate'),
      valueColor: pending > 0 ? '#FF8C42' : '#C8F04B',
    },
  ]

  const trendStyle = (tr: string) => {
    if (tr === 'up')   return { bg: 'rgba(76,175,80,0.12)',  color: '#4CAF50' }
    if (tr === 'down') return { bg: 'rgba(255,77,77,0.12)',  color: '#FF4D4D' }
    return               { bg: 'rgba(255,140,66,0.12)',      color: '#FF8C42' }
  }

  const statusInfo: Record<string, { color: string; bg: string; label: string; labelAr: string }> = {
    active:   { color: '#4CAF50', bg: 'rgba(76,175,80,0.15)',    label: 'Active',   labelAr: 'نشط' },
    expiring: { color: '#FF8C42', bg: 'rgba(255,140,66,0.15)',   label: 'Expiring', labelAr: 'ينتهي' },
    expired:  { color: '#888',    bg: 'rgba(136,136,136,0.12)',  label: 'Expired',  labelAr: 'منتهي' },
  }

  const greetingText = greeting(profile?.full_name ?? 'Trainer', locale)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white mb-0.5">{greetingText}</h1>
        <p className="text-xs font-mono" style={{ color: '#555' }}>{t('subtitle')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => {
          const ts = trendStyle(s.trend)
          return (
            <div
              key={s.label}
              className="relative overflow-hidden rounded-xl p-4"
              style={{ background: '#141414', border: '1px solid #222' }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle at top right, rgba(200,240,75,0.04), transparent 60%)' }}
              />
              <p className="text-[10px] font-mono tracking-[3px] uppercase mb-1.5" style={{ color: '#555' }}>{s.label}</p>
              <p
                className="font-mono leading-none mb-1"
                style={{ fontSize: s.small ? 22 : 30, fontWeight: 500, color: s.valueColor }}
              >
                {s.value}
              </p>
              <p className="text-[11px] mb-1.5" style={{ color: '#555' }}>{s.sub}</p>
              <span
                className="inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: ts.bg, color: ts.color }}
              >
                {s.trendLabel}
              </span>
            </div>
          )
        })}
      </div>

      {/* Revenue chart + Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">{t('monthlyRevenue')}</h2>
            <Link href="/trainer/earnings" className="text-xs text-brand hover:underline flex items-center gap-1">
              {t('viewDetails')} <ArrowRight size={12} className="rtl:rotate-180" />
            </Link>
          </div>
          <RevenueChart data={chartData} />
        </div>

        {/* Recent Activity */}
        <div className="card p-5 flex flex-col">
          <h2 className="font-semibold text-white mb-4">
            {locale === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}
          </h2>
          {!subscriptions?.length ? (
            <p className="text-sm text-muted text-center mt-4">
              {locale === 'ar' ? 'لا يوجد نشاط بعد' : 'No activity yet'}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {subscriptions.slice(0, 5).map((sub, idx) => {
                const profile = (sub.profiles as any) ?? {}
                return (
                  <div key={sub.id} className="flex items-start gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-black shrink-0 mt-0.5"
                      style={{ background: AV_COLORS[idx % AV_COLORS.length] }}
                    >
                      {initials(profile.full_name ?? '?')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/trainer/subscribers/${sub.subscriber_id}`}
                        className="text-xs font-medium text-white truncate hover:text-brand transition-colors block">
                        {profile.full_name ?? '—'}
                      </Link>
                      <p className="text-[11px] font-mono" style={{ color: '#555' }}>
                        {locale === 'ar' ? 'مشترك نشط' : 'Active subscriber'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Active subscribers — full table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #222', background: '#141414' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #222' }}>
          <h2 className="font-semibold text-white text-sm">{t('activeSubscribersTitle')}</h2>
          <Link href="/trainer/subscribers" className="text-xs hover:underline flex items-center gap-1" style={{ color: '#C8F04B' }}>
            {t('viewAll')} <ArrowRight size={12} className="rtl:rotate-180" />
          </Link>
        </div>

        {!subscriptions?.length ? (
          <p className="text-sm text-center py-10" style={{ color: '#555' }}>
            {locale === 'ar' ? 'لا يوجد مشتركون نشطون' : t('noActiveSubscribers')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 580 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222' }}>
                  {[
                    { en: 'Subscriber', ar: 'المشترك' },
                    { en: 'Plan',       ar: 'الخطة',    hidden: 'md' },
                    { en: 'Progress',   ar: 'التقدم' },
                    { en: 'Status',     ar: 'الحالة' },
                    { en: '',           ar: '' },
                  ].map((h, i) => (
                    <th key={i}
                      className={`text-start py-3 px-4 font-medium text-[10px] tracking-[2px] uppercase${h.hidden ? ` hidden ${h.hidden}:table-cell` : ''}`}
                      style={{ color: '#444' }}>
                      {locale === 'ar' ? h.ar : h.en}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub, idx) => {
                  const prof     = (sub.profiles as any) ?? {}
                  const plan     = (sub.trainer_plans as any) ?? {}
                  const daysIn   = sub.start_date
                    ? Math.max(0, Math.floor((Date.now() - new Date(sub.start_date).getTime()) / 86400000))
                    : 0
                  const total    = plan.duration_days ?? 30
                  const pct      = Math.min(100, Math.round((daysIn / total) * 100))
                  const st       = sub.status ?? 'active'
                  const si       = statusInfo[st] ?? statusInfo.active

                  return (
                    <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors"
                      style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div style={{
                            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                            background: AV_COLORS[idx % AV_COLORS.length],
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: 12, color: '#000',
                          }}>
                            {initials(prof.full_name ?? '?')}
                          </div>
                          <div>
                            <Link href={`/trainer/subscribers/${sub.subscriber_id}`}
                              className="font-semibold text-white hover:text-brand transition-colors text-sm">
                              {prof.full_name ?? '—'}
                            </Link>
                            <p className="text-[11px]" style={{ color: '#555' }}>{plan.name ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-white text-sm">{plan.name ?? '—'}</span>
                        {plan.duration_days && <span className="text-[11px] ms-1" style={{ color: '#555' }}>· {plan.duration_days}d</span>}
                      </td>
                      <td className="py-3 px-4">
                        <div style={{ minWidth: 100 }}>
                          <span className="text-xs font-mono" style={{ color: si.color }}>
                            {locale === 'ar' ? `اليوم ${daysIn}/${total}` : `Day ${daysIn}/${total}`}
                          </span>
                          <div style={{ height: 3, borderRadius: 2, background: '#222', marginTop: 5 }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: si.color, borderRadius: 2, transition: 'width .3s' }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: si.bg, color: si.color }}>
                          {locale === 'ar' ? si.labelAr : si.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/trainer/subscribers/${sub.subscriber_id}`}
                          className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10"
                          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc' }}>
                          {locale === 'ar' ? 'عرض' : 'View'}
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
