'use client'

import { useTransition }   from 'react'
import Image               from 'next/image'
import Link                from 'next/link'
import { ShieldCheck, Clock, CreditCard, ArrowLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { initiatePayment } from '@/lib/payments/actions'
import { getInitials, installmentAmount } from '@/lib/utils'
import { toast } from 'sonner'

interface Props {
  subscriptionId: string
  plan: { name: string; price: number; currency: string; duration_days: number }
  trainerName:   string
  trainerAvatar: string | null
  paymentMethod: 'tap' | 'tabby' | 'tamara'
  finalAmount:   number
  currency:      string
}

export function CheckoutClient({
  subscriptionId, plan, trainerName, trainerAvatar,
  paymentMethod, finalAmount, currency,
}: Props) {
  const t = useTranslations('checkout')
  const [pending, startTransition] = useTransition()

  const methodInfo = {
    tap:    { label: t('tapLabel'),    sub: t('tapSub') },
    tabby:  { label: t('tabbyLabel'),  sub: t('tabbySub') },
    tamara: { label: t('tamaraLabel'), sub: t('tamaraSub') },
  }

  function pay() {
    startTransition(async () => {
      try {
        await initiatePayment(subscriptionId)
      } catch {
        toast.error(t('paymentError'))
      }
    })
  }

  const info         = methodInfo[paymentMethod]
  const installments = paymentMethod === 'tabby' ? 4 : paymentMethod === 'tamara' ? 3 : 1
  const discounted   = finalAmount < plan.price

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md flex flex-col gap-5">
        <Link href="/trainers" className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors w-fit">
          <ArrowLeft size={15} /> {t('backBtn')}
        </Link>

        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>

        <div className="card p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-200 shrink-0">
              {trainerAvatar ? (
                <Image src={trainerAvatar} alt={trainerName} width={48} height={48}
                  className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-brand font-bold">
                  {getInitials(trainerName)}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{trainerName}</p>
              <p className="text-xs text-muted">{plan.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted">
            <Clock size={12} />
            {t('durationDays', { n: plan.duration_days })}
          </div>

          <div className="border-t border-white/[0.06] pt-4 flex flex-col gap-2">
            {discounted && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">{t('originalPrice')}</span>
                <span className="text-muted line-through">{plan.price} {plan.currency}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-white">{t('total')}</span>
              <span className="text-brand text-base">{finalAmount.toFixed(2)} {currency}</span>
            </div>
            {installments > 1 && (
              <div className="flex justify-between text-xs text-muted">
                <span>{t('installmentLine', { n: installments, amount: installmentAmount(finalAmount, installments), currency })}</span>
              </div>
            )}
          </div>
        </div>

        <div className="card p-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
            <CreditCard size={16} className="text-brand" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{info.label}</p>
            <p className="text-xs text-muted">{info.sub}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted justify-center">
          <ShieldCheck size={14} className="text-success" />
          {t('securePay')}
        </div>

        <button
          onClick={pay}
          disabled={pending}
          className="btn-brand w-full flex items-center justify-center gap-2 py-3 text-base"
        >
          {pending ? (
            <>
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              {t('redirecting')}
            </>
          ) : (
            <>
              <CreditCard size={17} />
              {t('payBtn', { amount: finalAmount.toFixed(2), currency })}
            </>
          )}
        </button>

        <p className="text-xs text-muted text-center">
          {t('agreePrefix')}{' '}
          <Link href="/terms" className="text-brand hover:underline">{t('termsLink')}</Link>
        </p>
      </div>
    </div>
  )
}
