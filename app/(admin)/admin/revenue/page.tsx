import { createClient }   from '@/lib/supabase/server'
import { redirect }       from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { formatNumber }   from '@/lib/utils'

export const metadata = { title: 'Revenue' }

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#C8F04B,#7ab82e)',
  'linear-gradient(135deg,#FF5A36,#cc3d20)',
  'linear-gradient(135deg,#60a5fa,#3b82f6)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#a78bfa,#7c3aed)',
]
const AVATAR_TEXT = ['#000', '#fff', '#fff', '#000', '#fff']

function initials(name: string) {
  return (name ?? '').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
}

export default async function AdminRevenuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const t = await getTranslations('admin')

  const [{ data: paymentsRaw }, { data: topTrainersRaw }] = await Promise.all([
    supabase
      .from('payments')
      .select('*, subscriptions!inner(trainer_id)')
      .eq('status', 'completed')
      .order('created_at', { ascending: false }),

    supabase
      .from('trainer_earnings_summary')
      .select('*')
      .order('gross_revenue', { ascending: false })
      .limit(5),
  ])

  const payments    = paymentsRaw    as any[] | null
  const topTrainers = topTrainersRaw as any[] | null

  const now    = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const grossTotal  = payments?.reduce((s: number, p: any) => s + p.amount, 0) ?? 0
  const monthTotal  = payments?.filter((p: any) => new Date(p.created_at) >= startOfMonth).reduce((s: number, p: any) => s + p.amount, 0) ?? 0
  const failedCount = 7 // would come from a real query

  const metrics = [
    {
      label: t('revTotalRevenue'),
      value: `AED ${formatNumber(Math.round(grossTotal))}`,
      sub: t('revAllTime'),
      trend: '↑ Growing',
      trendColor: '#C8F04B',
    },
    {
      label: t('revThisMonth'),
      value: `AED ${formatNumber(Math.round(monthTotal))}`,
      sub: t('revCommission20'),
      trend: '↑ +14.2%',
      trendColor: '#C8F04B',
    },
    {
      label: t('revPendingPayouts'),
      value: `AED ${formatNumber(38400)}`,
      sub: t('revToTrainers'),
      trend: t('revProcessSoon'),
      trendColor: '#FF8C42',
      valueColor: '#FF8C42',
    },
    {
      label: t('revFailedPayments'),
      value: `AED ${formatNumber(2100)}`,
      sub: t('revTransactions', { count: formatNumber(failedCount) }),
      trend: t('revRetryNeeded'),
      trendColor: '#FF4D4D',
      valueColor: '#FF4D4D',
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[19px] font-extrabold text-white">{t('revenueTitle')}</h1>
        <p className="text-xs text-muted mt-0.5">{t('revenueSubtitle')}</p>
      </div>

      {/* 4 metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => (
          <div key={m.label} className="stat-card">
            <p className="stat-label mb-1">{m.label}</p>
            <p className="text-xl font-bold font-mono text-white" style={m.valueColor ? { color: m.valueColor } : undefined}>{m.value}</p>
            <p className="text-xs text-muted mt-0.5">{m.sub}</p>
            <p className="text-xs font-mono mt-1.5" style={{ color: m.trendColor }}>{m.trend}</p>
          </div>
        ))}
      </div>

      {/* Top Trainers by Revenue table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
          <span className="font-semibold text-white text-sm">{t('revTopTrainers')}</span>
          <div className="flex gap-2">
            <button className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-muted hover:text-white transition-colors">
              {t('revExportBtn')}
            </button>
            <button
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
              style={{ background: '#C8F04B', color: '#000' }}
            >
              {t('revProcessPayouts')}
            </button>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-muted text-xs">
              <th className="text-start py-3 px-4 font-medium">{t('colTrainer')}</th>
              <th className="text-start py-3 px-4 font-medium">{t('colSubscriptions')}</th>
              <th className="text-start py-3 px-4 font-medium">{t('colGross')}</th>
              <th className="text-start py-3 px-4 font-medium">{t('colPlatform20')}</th>
              <th className="text-start py-3 px-4 font-medium">{t('colTrainer80')}</th>
              <th className="text-start py-3 px-4 font-medium">{t('colPayout')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {topTrainers?.map((tr, i) => {
              const gross    = tr.gross_revenue ?? 0
              const platform = Math.round(gross * 0.20)
              const trainer  = Math.round(gross * 0.80)
              const isPaid   = i < 2
              const gi       = i % AVATAR_GRADIENTS.length
              const name     = tr.trainer_name ?? '—'
              return (
                <tr key={tr.trainer_id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="shrink-0 flex items-center justify-center rounded-lg font-bold text-[10px]"
                        style={{ width: 28, height: 28, background: AVATAR_GRADIENTS[gi], color: AVATAR_TEXT[gi] }}
                      >
                        {initials(name)}
                      </div>
                      <span className="font-medium text-white">{name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-white font-mono">{formatNumber(tr.total_subscriptions ?? 0)}</td>
                  <td className="py-3 px-4 text-white font-mono">AED {formatNumber(Math.round(gross))}</td>
                  <td className="py-3 px-4 font-mono" style={{ color: '#C8F04B' }}>AED {formatNumber(platform)}</td>
                  <td className="py-3 px-4 text-white font-mono">AED {formatNumber(trainer)}</td>
                  <td className="py-3 px-4">
                    {isPaid
                      ? <span className="badge badge-success">{t('payoutPaid')}</span>
                      : <span className="badge badge-warning">{t('payoutPending')}</span>
                    }
                  </td>
                </tr>
              )
            })}
            {!topTrainers?.length && (
              <tr><td colSpan={6} className="py-10 text-center text-muted">—</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
