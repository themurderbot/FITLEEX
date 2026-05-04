'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDate, formatNumber } from '@/lib/utils'

interface Subscription {
  id: string
  status: string
  start_date?: string
  end_date?: string
  payment_method?: string
  created_at: string
  subscriber?: { full_name: string; country: string }
  trainer?:    { full_name: string }
  plan?:       { name: string; price: number; currency: string; duration_days: number }
}

interface Summary { active: number; expiring: number; expired: number; pending: number; total: number }
interface Props { subscriptions: Subscription[]; summary: Summary; currentStatus: string; page: number; pageSize: number; total: number }

export function SubscriptionsClient({ subscriptions, summary, currentStatus, page, pageSize, total }: Props) {
  const router     = useRouter()
  const t          = useTranslations('admin')
  const totalPages = Math.ceil(total / pageSize)

  const statusLabel: Record<string, string> = {
    active:    t('statusActive'),
    expiring:  t('statusExpiring'),
    expired:   t('statusExpired'),
    pending:   t('statusPendingSub'),
    cancelled: t('statusCancelled'),
  }
  const statusColor: Record<string, string> = {
    active: 'badge-success', expiring: 'badge-warning',
    expired: 'badge-muted', pending: 'badge-info', cancelled: 'badge-danger',
  }

  function setStatus(s: string) { router.push(`?status=${s}&page=1`) }
  function setPage(p: number)   { router.push(`?status=${currentStatus}&page=${p}`) }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[19px] font-extrabold text-white">{t('subscriptionsTitle')}</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: 'active',   label: t('statusActive'),   value: summary.active,   color: 'text-success' },
          { key: 'expiring', label: t('statusExpiring'),  value: summary.expiring, color: 'text-warning' },
          { key: 'expired',  label: t('statusExpired'),   value: summary.expired,  color: 'text-muted' },
          { key: 'pending',  label: t('statusPendingSub'),value: summary.pending,  color: 'text-info' },
        ].map(s => (
          <button key={s.key} onClick={() => setStatus(s.key)}
            className={`stat-card text-start transition-colors ${currentStatus === s.key ? 'border border-brand/30' : ''}`}>
            <p className={`text-2xl font-bold font-mono ${s.color}`}>{formatNumber(s.value)}</p>
            <p className="stat-label">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Tab filters */}
      <div className="flex gap-2 flex-wrap">
        {['active', 'expiring', 'expired', 'pending', 'all'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-lg text-sm border transition-colors ${currentStatus === s ? 'bg-brand text-black border-brand' : 'border-white/10 text-muted hover:text-white'}`}>
            {s === 'all' ? t('tabAll') : statusLabel[s]}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-muted">
              <th className="text-start p-4 font-medium">{t('colSubscriber')}</th>
              <th className="text-start p-4 font-medium">{t('colTrainer')}</th>
              <th className="text-start p-4 font-medium">{t('colPlan')}</th>
              <th className="text-start p-4 font-medium">{t('colStatus')}</th>
              <th className="text-start p-4 font-medium">{t('colExpiry')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {subscriptions.map(s => (
              <tr key={s.id} className="hover:bg-white/[0.02]">
                <td className="p-4 font-medium text-white">{(s.subscriber as any)?.full_name ?? '—'}</td>
                <td className="p-4 text-muted">{(s.trainer as any)?.full_name ?? '—'}</td>
                <td className="p-4 text-muted">{(s.plan as any)?.name ?? '—'}</td>
                <td className="p-4"><span className={`badge ${statusColor[s.status]}`}>{statusLabel[s.status]}</span></td>
                <td className="p-4 text-muted font-mono">{s.end_date ? formatDate(s.end_date) : '—'}</td>
              </tr>
            ))}
            {!subscriptions.length && (
              <tr><td colSpan={5} className="p-8 text-center text-muted">{t('noSubscriptions')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn-outline p-2 disabled:opacity-40"><ChevronRight size={16} /></button>
          <span className="text-sm text-muted font-mono">{t('page', { page: formatNumber(page), total: formatNumber(totalPages) })}</span>
          <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="btn-outline p-2 disabled:opacity-40"><ChevronLeft size={16} /></button>
        </div>
      )}
    </div>
  )
}
