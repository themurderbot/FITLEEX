import Link from 'next/link'
import { Clock, CheckCircle2, FileText, Bell } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export default async function PendingApprovalPage() {
  const t = await getTranslations('auth')

  const steps = [
    { icon: FileText,     label: t('pendingStep1'), done: true  },
    { icon: CheckCircle2, label: t('pendingStep2'), done: false },
    { icon: Bell,         label: t('pendingStep3'), done: false },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[500px] h-[500px] rounded-full bg-warning/5 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md text-center">
        <Link href="/" className="inline-block mb-8">
          <span className="font-display text-3xl text-brand">FITLEEX</span>
        </Link>

        <div className="w-20 h-20 rounded-2xl bg-warning/10 border border-warning/20
                        flex items-center justify-center mx-auto mb-6">
          <Clock size={36} className="text-warning" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">{t('pendingTitle')}</h1>
        <p className="text-muted mb-10 leading-relaxed">{t('pendingBody')}</p>

        <div className="card p-6 text-start mb-6">
          <div className="flex flex-col gap-4">
            {steps.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    s.done
                      ? 'bg-success/15 text-success'
                      : 'bg-white/5 text-muted border border-white/10'
                  }`}>
                    <Icon size={15} />
                  </div>
                  <span className={`text-sm ${s.done ? 'text-white' : 'text-muted'}`}>{s.label}</span>
                  {s.done && <span className="badge badge-success ms-auto">{t('doneBadge')}</span>}
                  {!s.done && i === 1 && <span className="badge badge-warning ms-auto">{t('inProgressBadge')}</span>}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/" className="btn-outline py-3">{t('backHome')}</Link>
          <p className="text-xs text-muted">
            {t('haveQuestion')}{' '}
            <a href="mailto:support@FITLEEX.com" className="text-brand hover:underline">
              {t('contactUs')}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
