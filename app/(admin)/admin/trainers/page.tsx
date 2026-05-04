import { createClient }   from '@/lib/supabase/server'
import { redirect }        from 'next/navigation'
import Link                from 'next/link'
import { getTranslations } from 'next-intl/server'
import { formatDate, formatNumber } from '@/lib/utils'
import type { ApprovalStatus } from '@/types/database'

export const metadata = { title: 'Trainers' }

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#C8F04B,#7ab82e)',
  'linear-gradient(135deg,#FF5A36,#cc3d20)',
  'linear-gradient(135deg,#60a5fa,#3b82f6)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#a78bfa,#7c3aed)',
  'linear-gradient(135deg,#34d399,#059669)',
]
const AVATAR_TEXT = ['#000', '#fff', '#fff', '#000', '#fff', '#fff']

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

interface PageProps { searchParams: Promise<{ status?: string }> }

export default async function AdminTrainersPage({ searchParams }: PageProps) {
  const { status = 'pending' } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const t = await getTranslations('admin')

  let query = supabase
    .from('trainers')
    .select('*, profiles(*)')
    .order('created_at', { ascending: false })

  if (status !== 'all') query = query.eq('approval_status', status as ApprovalStatus)

  const { data: trainersRaw } = await query
  const trainers = trainersRaw as any[] | null

  const pending  = trainers?.filter((tr: any) => tr.approval_status === 'pending')  ?? []
  const approved = trainers?.filter((tr: any) => tr.approval_status === 'approved') ?? []

  const tabs = [
    { key: 'pending',  label: t('tabPending') },
    { key: 'approved', label: t('tabApproved') },
    { key: 'rejected', label: t('tabRejected') },
    { key: 'all',      label: t('tabAll') },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[19px] font-extrabold text-white">{t('trainers')}</h1>
          <p className="text-xs text-muted mt-0.5">{t('trainerMgmtSubtitle')}</p>
        </div>
        <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
          {tabs.map(tab => (
            <Link
              key={tab.key}
              href={`/admin/trainers?status=${tab.key}`}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                status === tab.key ? 'bg-brand text-black' : 'text-muted hover:text-white'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Pending Approvals section */}
      {(status === 'pending' || status === 'all') && pending.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: 'var(--warning, #FF8C42)' }}>
              {t('pendingApprovalsLabel')}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full border border-warning/30 text-warning" style={{ color: 'var(--warning, #FF8C42)', borderColor: 'rgba(255,140,66,0.3)' }}>
              {t('pendingCount', { count: formatNumber(pending.length) })}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {pending.map((trainer, i) => {
              const profile = trainer.profiles as { full_name: string; country: string } | null
              const name = profile?.full_name ?? '—'
              const gi = i % AVATAR_GRADIENTS.length
              return (
                <div key={trainer.id} className="card p-4 flex items-center gap-4">
                  <div
                    className="shrink-0 flex items-center justify-center rounded-xl font-bold text-sm"
                    style={{ width: 42, height: 42, background: AVATAR_GRADIENTS[gi], color: AVATAR_TEXT[gi] }}
                  >
                    {initials(name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{name}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {profile?.country} · {trainer.specialty ?? '—'}
                    </p>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-medium" style={{ background: 'rgba(76,175,80,0.12)', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.25)' }}>{t('docChipId')}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-medium" style={{ background: 'rgba(76,175,80,0.12)', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.25)' }}>{t('docChipEmail')}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-medium" style={{ background: 'rgba(76,175,80,0.12)', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.25)' }}>{t('docChipSocial')}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-medium" style={{ background: 'rgba(255,140,66,0.12)', color: '#FF8C42', border: '1px solid rgba(255,140,66,0.25)' }}>{t('docChipPhone')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/admin/trainers/${trainer.id}?action=approve`}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                      style={{ background: 'rgba(76,175,80,0.15)', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.3)' }}
                    >
                      ✓ {t('approve')}
                    </Link>
                    <Link
                      href={`/admin/trainers/${trainer.id}?action=reject`}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                      style={{ background: 'rgba(255,77,77,0.12)', color: '#FF4D4D', border: '1px solid rgba(255,77,77,0.25)' }}
                    >
                      ✕ {t('reject')}
                    </Link>
                    <Link
                      href={`/admin/trainers/${trainer.id}`}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium text-muted border border-white/10 hover:text-white hover:border-white/20 transition-colors"
                    >
                      {t('viewProfile')}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* No pending trainers */}
      {status === 'pending' && pending.length === 0 && (
        <div className="card py-12 text-center text-muted">{t('noPendingTrainers')}</div>
      )}

      {/* Active Trainers table */}
      {(status === 'approved' || status === 'all') && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
            <span className="font-semibold text-white text-sm">{t('activeTrainersLabel')}</span>
            <span className="text-xs text-muted font-mono">{t('totalCount', { count: formatNumber(approved.length) })}</span>
          </div>
          {!approved.length ? (
            <p className="text-sm text-muted p-8 text-center">{t('noTrainers')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-muted text-xs">
                  <th className="text-start py-3 px-4 font-medium">{t('colTrainer')}</th>
                  <th className="text-start py-3 px-4 font-medium">{t('colCountry')}</th>
                  <th className="text-start py-3 px-4 font-medium">{t('colSubscriptions')}</th>
                  <th className="text-start py-3 px-4 font-medium">{t('colRevMTD')}</th>
                  <th className="text-start py-3 px-4 font-medium">{t('colRating')}</th>
                  <th className="text-start py-3 px-4 font-medium">{t('colStatus')}</th>
                  <th className="text-start py-3 px-4 font-medium">{t('colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {approved.map((trainer, i) => {
                  const profile = trainer.profiles as { full_name: string; country: string } | null
                  const name = profile?.full_name ?? '—'
                  const gi = i % AVATAR_GRADIENTS.length
                  const rating = trainer.rating ?? 0
                  const stars = Math.round(rating)
                  return (
                    <tr key={trainer.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="shrink-0 flex items-center justify-center rounded-lg font-bold text-[11px]"
                            style={{ width: 32, height: 32, background: AVATAR_GRADIENTS[gi], color: AVATAR_TEXT[gi] }}
                          >
                            {initials(name)}
                          </div>
                          <div>
                            <p className="font-medium text-white">{name}</p>
                            <p className="text-xs text-muted">{trainer.specialty ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted">{profile?.country ?? '—'}</td>
                      <td className="py-3 px-4 text-white font-mono">{formatNumber(trainer.subscribers_count ?? 0)}</td>
                      <td className="py-3 px-4 font-mono font-medium" style={{ color: '#C8F04B' }}>
                        AED {formatNumber((trainer as any).revenue_mtd ?? 0)}
                      </td>
                      <td className="py-3 px-4">
                        <span style={{ color: '#FFB800' }}>{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
                        <span className="text-xs text-muted font-mono ms-1">{rating > 0 ? rating.toFixed(1) : '—'}</span>
                      </td>
                      <td className="py-3 px-4"><span className="badge badge-success">{t('statusActive')}</span></td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Link href={`/admin/trainers/${trainer.id}`} className="text-xs px-2.5 py-1 rounded-lg border border-white/10 text-muted hover:text-white hover:border-white/20 transition-colors">
                            {t('viewBtn')}
                          </Link>
                          <Link href={`/admin/trainers/${trainer.id}?action=suspend`} className="text-xs px-2.5 py-1 rounded-lg transition-colors" style={{ background: 'rgba(255,77,77,0.1)', color: '#FF4D4D', border: '1px solid rgba(255,77,77,0.2)' }}>
                            {t('suspendBtn')}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Rejected table */}
      {status === 'rejected' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.06]">
            <span className="font-semibold text-white text-sm">{t('tabRejected')}</span>
          </div>
          {!trainers?.length ? (
            <p className="text-sm text-muted p-8 text-center">{t('noTrainers')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-muted text-xs">
                  <th className="text-start py-3 px-4 font-medium">{t('colTrainer')}</th>
                  <th className="text-start py-3 px-4 font-medium">{t('colCountry')}</th>
                  <th className="text-start py-3 px-4 font-medium">{t('colSpecialty')}</th>
                  <th className="text-start py-3 px-4 font-medium">{t('appliedOn')}</th>
                  <th className="text-start py-3 px-4 font-medium">{t('colStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {trainers.map((trainer, i) => {
                  const profile = trainer.profiles as { full_name: string; country: string } | null
                  const name = profile?.full_name ?? '—'
                  const gi = i % AVATAR_GRADIENTS.length
                  return (
                    <tr key={trainer.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="shrink-0 flex items-center justify-center rounded-lg font-bold text-[11px]" style={{ width: 32, height: 32, background: AVATAR_GRADIENTS[gi], color: AVATAR_TEXT[gi] }}>
                            {initials(name)}
                          </div>
                          <p className="font-medium text-white">{name}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted">{profile?.country ?? '—'}</td>
                      <td className="py-3 px-4 text-muted">{trainer.specialty ?? '—'}</td>
                      <td className="py-3 px-4 text-muted font-mono">{formatDate(trainer.created_at)}</td>
                      <td className="py-3 px-4"><span className="badge badge-danger">{t('tabRejected')}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
