'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Search } from 'lucide-react'
import { formatDate, formatNumber } from '@/lib/utils'

interface Profile {
  id: string
  full_name: string
  role: string
  country: string
  created_at: string
  avatar_url?: string
  status?: string
}

interface Props {
  profiles: Profile[]
  currentUserId: string
  subscriberCount: number
  trainerCount: number
  suspendedCount: number
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#C8F04B,#7ab82e)',
  'linear-gradient(135deg,#60a5fa,#3b82f6)',
  'linear-gradient(135deg,#FF5A36,#cc3d20)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#a78bfa,#7c3aed)',
  'linear-gradient(135deg,#34d399,#059669)',
]
const AVATAR_TEXT = ['#000', '#fff', '#fff', '#000', '#fff', '#fff']

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export function UsersClient({ profiles, currentUserId, subscriberCount, trainerCount, suspendedCount }: Props) {
  const t = useTranslations('admin')
  const [q, setQ]       = useState('')
  const [role, setRole] = useState('all')

  const roleLabel: Record<string, string> = {
    admin:      t('roleAdmin'),
    trainer:    t('roleTrainer'),
    subscriber: t('roleSubscriber'),
  }
  const roleBadge: Record<string, string> = {
    admin:      'badge-danger',
    trainer:    'badge-warning',
    subscriber: 'badge-info',
  }

  const filtered = profiles.filter(p => {
    const matchQ    = !q || p.full_name.toLowerCase().includes(q.toLowerCase())
    const matchRole = role === 'all' || p.role === role
    return matchQ && matchRole
  })

  function exportCsv() {
    const rows = [
      ['Name', 'Role', 'Country', 'Joined', 'Status'],
      ...filtered.map(p => [p.full_name, p.role, p.country, formatDate(p.created_at), p.status ?? 'active']),
    ]
    const csv  = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'users.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[19px] font-extrabold text-white">{t('userMgmtTitle')}</h1>
          <p className="text-xs text-muted mt-0.5">{t('userCount', { count: formatNumber(profiles.length) })}</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute inset-y-0 start-3 m-auto text-muted" />
          <input
            className="input ps-9 w-48"
            placeholder={t('searchByName')}
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <button onClick={() => setRole('subscriber')} className={`stat-card text-start transition-colors ${role === 'subscriber' ? 'border border-brand/30' : ''}`}>
          <p className="text-2xl font-bold font-mono" style={{ color: '#C8F04B' }}>{formatNumber(subscriberCount)}</p>
          <p className="stat-label">{t('statSubscribersLabel')}</p>
          <p className="text-xs font-mono mt-1" style={{ color: '#C8F04B' }}>{t('statSubsThisMonth', { count: formatNumber(0) })}</p>
        </button>
        <button onClick={() => setRole('trainer')} className={`stat-card text-start transition-colors ${role === 'trainer' ? 'border border-info/30' : ''}`}>
          <p className="text-2xl font-bold font-mono text-info">{formatNumber(trainerCount)}</p>
          <p className="stat-label">{t('roleTrainer')}</p>
          <p className="text-xs font-mono mt-1 text-info">{t('statTrainersThisMonth', { count: formatNumber(0) })}</p>
        </button>
        <button onClick={() => setRole('all')} className="stat-card text-start">
          <p className="text-2xl font-bold font-mono text-danger">{formatNumber(suspendedCount)}</p>
          <p className="stat-label">{t('statSuspendedLabel')}</p>
          <p className="text-xs font-mono mt-1 text-warning">{t('statSuspendedCases')}</p>
        </button>
      </div>

      {/* Tab filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'subscriber', 'trainer', 'admin'].map(r => (
          <button key={r} onClick={() => setRole(r)}
            className={`px-4 py-2 rounded-lg text-sm border transition-colors ${role === r ? 'bg-brand text-black border-brand' : 'border-white/10 text-muted hover:text-white'}`}>
            {r === 'all' ? t('tabAll') : roleLabel[r]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
          <span className="font-semibold text-white text-sm">{t('allUsersTableTitle')}</span>
          <button onClick={exportCsv} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-muted hover:text-white transition-colors">
            {t('exportCsvBtn')}
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-muted text-xs">
              <th className="text-start py-3 px-4 font-medium">{t('colUser')}</th>
              <th className="text-start py-3 px-4 font-medium">{t('colRole')}</th>
              <th className="text-start py-3 px-4 font-medium">{t('colJoined')}</th>
              <th className="text-start py-3 px-4 font-medium">{t('colCountry')}</th>
              <th className="text-start py-3 px-4 font-medium">{t('colStatus')}</th>
              <th className="text-start py-3 px-4 font-medium">{t('colAction')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.map((p, i) => {
              const gi      = i % AVATAR_GRADIENTS.length
              const isSusp  = p.status === 'suspended'
              return (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="shrink-0 flex items-center justify-center rounded-lg font-bold text-[10px]"
                        style={{ width: 28, height: 28, background: AVATAR_GRADIENTS[gi], color: AVATAR_TEXT[gi] }}
                      >
                        {initials(p.full_name)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{p.full_name}</p>
                        {p.id === currentUserId && <span className="text-[10px] text-brand">{t('youLabel')}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4"><span className={`badge ${roleBadge[p.role] ?? 'badge-muted'}`}>{roleLabel[p.role] ?? p.role}</span></td>
                  <td className="py-3 px-4 text-muted font-mono text-xs">{formatDate(p.created_at)}</td>
                  <td className="py-3 px-4 text-muted">{p.country}</td>
                  <td className="py-3 px-4">
                    {isSusp
                      ? <span className="badge badge-danger">{t('statusSuspended')}</span>
                      : <span className="badge badge-success">{t('statusActive')}</span>
                    }
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button className="text-xs px-2.5 py-1 rounded-lg border border-white/10 text-muted hover:text-white transition-colors">
                        {t('viewBtn')}
                      </button>
                      {isSusp && (
                        <button className="text-xs px-2.5 py-1 rounded-lg transition-colors" style={{ background: 'rgba(76,175,80,0.12)', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.25)' }}>
                          {t('reactivateBtn')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {!filtered.length && (
              <tr><td colSpan={6} className="py-10 text-center text-muted">{t('noUsers')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
