import Link                from 'next/link'
import { XCircle }         from 'lucide-react'
import { getTranslations } from 'next-intl/server'

interface PageProps { searchParams: Promise<{ sub?: string; reason?: string }> }

export default async function CheckoutFailedPage({ searchParams }: PageProps) {
  const { sub, reason } = await searchParams
  const t = await getTranslations('checkout')

  const reasonMessages: Record<string, string> = {
    not_captured: t('failedNotCaptured'),
    gateway:      t('failedGateway'),
  }

  const message = reason ? (reasonMessages[reason] ?? t('failedDefault')) : t('failedDefault')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center">
          <XCircle size={40} className="text-danger" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('failedTitle')}</h1>
          <p className="text-muted text-sm">{message}</p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          {sub && (
            <Link href={`/checkout/${sub}`} className="btn-brand w-full text-center">
              {t('tryAgainBtn')}
            </Link>
          )}
          <Link href="/trainers" className="btn-outline w-full text-center">
            {t('backToTrainersBtn')}
          </Link>
        </div>

        <p className="text-xs text-muted">{t('noChargeMade')}</p>
      </div>
    </div>
  )
}
