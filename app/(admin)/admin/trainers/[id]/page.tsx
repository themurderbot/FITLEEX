import { createClient }     from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getTranslations }    from 'next-intl/server'
import Link                   from 'next/link'
import { ArrowRight, FileText, CheckCircle2, ExternalLink } from 'lucide-react'
import { TrainerApprovalActions } from './TrainerApprovalActions'
import { formatDate, formatNumber } from '@/lib/utils'
import type { ApprovalStatus } from '@/types/database'

export const metadata = { title: 'Trainer Profile' }

interface PageProps { params: Promise<{ id: string }> }

export default async function AdminTrainerDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const t = await getTranslations('admin')

  const [{ data: trainerRaw }, { data: docsRaw }, { data: plansRaw }] = await Promise.all([
    supabase.from('trainers').select('*, profiles(*)').eq('id', id).single(),
    supabase.from('trainer_documents').select('*').eq('trainer_id', id),
    supabase.from('trainer_plans').select('*').eq('trainer_id', id),
  ])

  if (!trainerRaw) notFound()

  const trainer = trainerRaw as any
  const docs    = (docsRaw  as any[] | null) ?? []
  const plans   = (plansRaw as any[] | null) ?? []

  const profile = trainer.profiles as {
    full_name: string; country: string; language: string;
    avatar_url: string | null; created_at: string
  } | null

  const st = trainer.approval_status as ApprovalStatus

  const statusConfig = {
    pending:  { cls: 'badge-warning', label: t('tabPending') },
    approved: { cls: 'badge-success', label: t('approved') },
    rejected: { cls: 'badge-danger',  label: t('rejected') },
  }

  const docTypeLabel: Record<string, string> = {
    id:    t('docTypeId'),
    cert:  t('docTypeCert'),
    photo: t('docTypePhoto'),
  }

  const infoRows = [
    { label: t('fieldName'),       value: profile?.full_name },
    { label: t('colCountry'),      value: profile?.country },
    { label: t('fieldLanguage'),   value: profile?.language === 'ar' ? t('langArabic') : t('langEnglish') },
    { label: t('fieldExperience'), value: `${formatNumber(trainer.years_experience ?? 0)} ${t('days')}` },
    { label: t('appliedOn'),       value: formatDate(trainer.created_at) },
    { label: t('colRating'),       value: trainer.rating ? `${trainer.rating.toFixed(1)} ★` : t('noRating') },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/trainers" className="text-muted hover:text-white transition-colors">
          <ArrowRight size={18} />
        </Link>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg shrink-0"
          style={{ background: 'linear-gradient(135deg,#C8F04B,#7ab82e)', color: '#000' }}>
          {profile?.full_name?.[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">{profile?.full_name}</h1>
            <span className={`badge ${statusConfig[st].cls}`}>{statusConfig[st].label}</span>
          </div>
          <p className="text-sm text-muted">{trainer.specialty} · {profile?.country}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Profile info */}
          <div className="card p-5">
            <h2 className="font-semibold text-white mb-4">{t('trainerInfoTitle')}</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {infoRows.map(row => (
                <div key={row.label}>
                  <span className="text-muted block text-xs">{row.label}</span>
                  <span className="text-white">{row.value ?? '—'}</span>
                </div>
              ))}
            </div>
            {trainer.bio && (
              <div className="mt-4 pt-4 border-t border-white/[0.04]">
                <span className="text-xs text-muted block mb-1">{t('fieldBio')}</span>
                <p className="text-sm text-white leading-relaxed">{trainer.bio}</p>
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="card p-5">
            <h2 className="font-semibold text-white mb-4">{t('trainerDocsTitle')}</h2>
            {!docs.length ? (
              <p className="text-sm text-muted">{t('noDocs')}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {docs.map((doc: any) => (
                  <div key={doc.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        doc.verified ? 'bg-success/10 text-success' : 'bg-white/5 text-muted'
                      }`}>
                        {doc.verified ? <CheckCircle2 size={15} /> : <FileText size={15} />}
                      </div>
                      <div>
                        <p className="text-sm text-white">{docTypeLabel[doc.type] ?? doc.type}</p>
                        <p className="text-xs text-muted font-mono">{formatDate(doc.created_at)}</p>
                      </div>
                    </div>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-brand hover:underline">
                      {t('openDocBtn')} <ExternalLink size={11} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Plans */}
          {plans.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-white mb-4">{t('trainerPlansTitle')}</h2>
              <div className="flex flex-col gap-2">
                {plans.map((plan: any) => (
                  <div key={plan.id}
                    className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                    <p className="text-sm text-white">{plan.name}</p>
                    <div className="flex items-center gap-3 text-sm text-muted">
                      <span className="font-mono">{formatNumber(plan.duration_days)} {t('days')}</span>
                      <span className="font-medium" style={{ color: '#C8F04B' }}>{formatNumber(plan.price)} {plan.currency}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: approval actions */}
        <div>
          <TrainerApprovalActions
            trainerId={trainer.id}
            currentStatus={st}
            rejectionReason={trainer.rejection_reason ?? null}
          />
        </div>
      </div>
    </div>
  )
}
