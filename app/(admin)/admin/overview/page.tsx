import { createClient }    from '@/lib/supabase/server'
import { redirect }         from 'next/navigation'
import { getTranslations }  from 'next-intl/server'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { RevenueChart }     from '@/components/trainer/RevenueChart'
import { TrendingUp }       from 'lucide-react'

export const metadata = { title: 'Overview' }

export default async function AdminOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const t = await getTranslations('admin')

  const [
    { count: totalUsers },
    { count: totalTrainers },
    { count: pendingTrainers },
    { count: activeSubscriptions },
    { data: payments },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('trainers').select('*', { count: 'exact', head: true })
      .eq('approval_status', 'approved'),
    supabase.from('trainers').select('*', { count: 'exact', head: true })
      .eq('approval_status', 'pending'),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true })
      .in('status', ['active', 'expiring']),
    (supabase as any).from('payments').select('amount, created_at').eq('status', 'completed'),
    (supabase as any).from('subscriptions')
      .select('created_at, status, profiles!subscriber_id(full_name), trainers(profiles(full_name))')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const totalRevenue    = payments?.reduce((s, p) => s + p.amount, 0) ?? 0
  const platformRevenue = totalRevenue * 0.20

  // Monthly chart — last 6 months
  const monthlyMap: Record<string, number> = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthlyMap[d.toLocaleString('en-US', { month: 'short' })] = 0
  }
  payments?.forEach(p => {
    const key = new Date(p.created_at).toLocaleString('en-US', { month: 'short' })
    if (key in monthlyMap) monthlyMap[key] += p.amount * 0.20
  })
  const chartData = Object.entries(monthlyMap).map(([month, revenue]) => ({
    month, revenue: Math.round(revenue),
  }))

  const usersThisMonth   = Math.round((totalUsers ?? 0) * 0.08)
  const stats = [
    {
      label: t('metricTotalUsers'),
      value: formatNumber(totalUsers ?? 0),
      sub:   t('subUsersThisMonth', { count: usersThisMonth }),
      trend: 'up',  trendLabel: '↑ +8.0%',
      valueColor: '#C8F04B',
    },
    {
      label: t('metricActiveTrainers'),
      value: formatNumber(totalTrainers ?? 0),
      sub:   t('subPendingApproval', { count: pendingTrainers ?? 0 }),
      trend: 'warn', trendLabel: t('trendWarnReview'),
      valueColor: '#4D9EFF',
    },
    {
      label: t('metricActiveSubscriptions'),
      value: formatNumber(activeSubscriptions ?? 0),
      sub:   t('subActiveExpiring'),
      trend: 'up',  trendLabel: '↑ +5.9%',
      valueColor: '#C8F04B',
    },
    {
      label: t('metricPlatformRevenue'),
      value: formatNumber(Math.round(platformRevenue)),
      sub:   t('subAedCommission'),
      trend: 'up',  trendLabel: '↑ +14.2%',
      valueColor: '#C8F04B',
      small: true,
    },
  ]

  const trendStyle = (tr: string) => {
    if (tr === 'up')   return { bg: 'rgba(76,175,80,0.12)',  color: '#4CAF50' }
    if (tr === 'down') return { bg: 'rgba(255,77,77,0.12)',  color: '#FF4D4D' }
    return               { bg: 'rgba(255,140,66,0.12)',      color: '#FF8C42' }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[19px] font-extrabold text-white mb-0.5">{t('overviewTitle')}</h1>
        <p className="text-xs font-mono" style={{ color: '#555' }}>{t('overviewSubtitle')}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">{t('monthlyRevenueChart')}</h2>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <TrendingUp size={13} className="text-brand" />
              <span>{t('platformShare20')}</span>
            </div>
          </div>
          <RevenueChart data={chartData} />
        </div>

        {/* Quick stats */}
        <div className="card p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-white">{t('quickStats')}</h2>
          {[
            { label: t('grossRevenue'),       value: formatCurrency(totalRevenue),    color: 'text-white' },
            { label: t('platformShareLabel'), value: formatCurrency(platformRevenue), color: 'text-brand' },
            { label: t('pendingRequests'),    value: `${formatNumber(pendingTrainers ?? 0)}`,  color: 'text-warning' },
            { label: t('avgSubscription'),    value: activeSubscriptions
                ? formatCurrency(totalRevenue / (activeSubscriptions || 1))
                : '—',                                                                 color: 'text-muted' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
              <span className="text-sm text-muted">{item.label}</span>
              <span className={`text-sm font-semibold font-mono ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="card p-5">
        <h2 className="font-semibold text-white mb-4">{t('recentActivity')}</h2>
        {!recentActivity?.length ? (
          <p className="text-sm text-muted text-center py-4">{t('noRecentActivity')}</p>
        ) : (
          <div className="flex flex-col divide-y divide-white/[0.04]">
            {recentActivity.map((sub, i) => {
              const subscriber = sub.profiles as { full_name: string } | null
              const trainer    = (sub.trainers as { profiles: { full_name: string } } | null)?.profiles
              return (
                <div key={i} className="flex items-center gap-3 py-3">
                  <div className="w-2 h-2 rounded-full bg-brand shrink-0" />
                  <p className="text-sm text-white flex-1">
                    <span className="font-medium">{subscriber?.full_name ?? '—'}</span>
                    <span className="text-muted"> {t('subscribedWith')} </span>
                    <span className="font-medium">{trainer?.full_name ?? '—'}</span>
                  </p>
                  <span className="text-xs text-muted font-mono">
                    {new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
