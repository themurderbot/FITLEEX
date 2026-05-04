'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { formatDate } from '@/lib/utils'

interface Report {
  id: string
  type: string
  description: string
  status: string
  created_at: string
  reporter?: { full_name: string; role: string }
  reported?:  { full_name: string; role: string }
}

const TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  harassment: { bg: 'rgba(255,77,77,0.12)',  color: '#FF4D4D' },
  spam:       { bg: 'rgba(255,140,66,0.12)', color: '#FF8C42' },
  other:      { bg: 'rgba(120,120,120,0.12)', color: '#888' },
}

export function ReportsClient({ reports, defaultStatus }: { reports: Report[]; defaultStatus: string }) {
  const t = useTranslations('admin')
  const [status, setStatus] = useState(defaultStatus)

  const typeLabel: Record<string, string> = {
    harassment: t('typeHarassment'),
    spam:       t('typeSpam'),
    other:      t('typeOther'),
  }
  const statusLabel: Record<string, string> = {
    pending:   t('tabPending'),
    reviewed:  t('statusReviewed'),
    dismissed: t('statusDismissed'),
    all:       t('tabAll'),
  }
  const statusBadge: Record<string, string> = {
    pending:   'badge-danger',
    reviewed:  'badge-success',
    dismissed: 'badge-muted',
  }

  const filtered = status === 'all' ? reports : reports.filter(r => r.status === status)
  const openCount = reports.filter(r => r.status === 'pending').length

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[19px] font-extrabold text-white">{t('reportsTitle')}</h1>
        {openCount > 0 && (
          <p className="text-xs mt-0.5" style={{ color: '#FF8C42' }}>
            {t('reportsSubtitle', { count: openCount })}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['pending', 'reviewed', 'dismissed', 'all'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-lg text-sm border transition-colors ${status === s ? 'bg-brand text-black border-brand' : 'border-white/10 text-muted hover:text-white'}`}>
            {statusLabel[s]}
          </button>
        ))}
      </div>

      {/* Report cards */}
      <div className="flex flex-col gap-3">
        {filtered.map(r => {
          const typeStyle = TYPE_STYLE[r.type] ?? TYPE_STYLE.other
          return (
            <div key={r.id} className="card p-4 flex flex-col gap-3">
              {/* Card header */}
              <div className="flex items-center gap-3">
                <div
                  className="shrink-0 flex items-center justify-center rounded-full font-bold text-xs"
                  style={{ width: 34, height: 34, background: '#2a2a2a', color: '#555' }}
                >
                  ??
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">
                    Reported by: {r.reporter?.full_name ?? `Subscriber`}
                  </p>
                  <p className="text-xs text-muted font-mono">{formatDate(r.created_at)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-[10px] font-bold font-mono px-2 py-0.5 rounded"
                    style={{ background: typeStyle.bg, color: typeStyle.color }}
                  >
                    {(typeLabel[r.type] ?? r.type).toUpperCase()}
                  </span>
                  <span className={`badge ${statusBadge[r.status] ?? 'badge-muted'}`}>
                    {r.status === 'pending' ? t('openStatus') : statusLabel[r.status]}
                  </span>
                </div>
              </div>

              {/* Quote */}
              <p className="text-sm italic" style={{ color: '#888', lineHeight: 1.6 }}>
                "{r.description}"
              </p>

              {/* Reporter / Reported */}
              <div className="flex gap-6 text-xs text-muted">
                <span>{t('reporterLabel')} {r.reporter?.full_name ?? '—'}</span>
                <span>{t('reportedLabel')} {r.reported?.full_name ?? '—'}</span>
              </div>

              {/* Actions — only show for pending */}
              {r.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <button
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                    style={{ background: '#C8F04B', color: '#000' }}
                  >
                    {t('reviewResolveBtn')}
                  </button>
                  <button
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                    style={{ background: 'rgba(255,77,77,0.12)', color: '#FF4D4D', border: '1px solid rgba(255,77,77,0.25)' }}
                  >
                    {t('suspendTrainerBtn')}
                  </button>
                  <button className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-muted hover:text-white transition-colors">
                    {t('dismissBtn')}
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {!filtered.length && (
          <div className="card p-10 text-center text-muted">{t('noReports')}</div>
        )}
      </div>
    </div>
  )
}
