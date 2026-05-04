'use client'

import { useState, useTransition } from 'react'
import Image         from 'next/image'
import Link          from 'next/link'
import { useRouter } from 'next/navigation'
import { Star, Users, Award, Clock, CheckCircle2, CreditCard, ArrowLeft } from 'lucide-react'
import { createClient }  from '@/lib/supabase/client'
import { toast }         from 'sonner'
import { useTranslations } from 'next-intl'
import { cn }            from '@/lib/utils'
import { getInitials, installmentAmount } from '@/lib/utils'

interface TrainerInfo {
  id:                string
  specialty:         string | null
  bio:               string | null
  bio_ar:            string | null
  years_experience:  number
  rating:            number | null
  rating_count:      number
  subscribers_count: number
  is_featured:       boolean
  full_name:         string
  avatar_url:        string | null
  country:           string
}

interface Plan {
  id:             string
  name:           string
  name_ar:        string | null
  description:    string | null
  description_ar: string | null
  duration_days:  number
  price:          number
  currency:       string
}

type PaymentMethod = 'tap' | 'tabby' | 'tamara'

interface Props {
  trainer:              TrainerInfo
  plans:                Plan[]
  userId:               string | null
  existingSubscription: { id: string; status: string; end_date: string | null } | null
}

export function TrainerProfileClient({ trainer, plans, userId, existingSubscription }: Props) {
  const t      = useTranslations('trainerProfile')
  const router = useRouter()
  const supabase = createClient()

  const [selectedPlan,    setSelectedPlan]    = useState<Plan | null>(plans[0] ?? null)
  const [paymentMethod,   setPaymentMethod]   = useState<PaymentMethod>('tap')
  const [promoCode,       setPromoCode]       = useState('')
  const [promoApplied,    setPromoApplied]    = useState<{ discount_pct: number; code: string } | null>(null)
  const [promoLoading,    startPromo]         = useTransition()
  const [subscribing,     startSubscribe]     = useTransition()

  const discountedPrice = selectedPlan
    ? promoApplied
      ? selectedPlan.price * (1 - promoApplied.discount_pct / 100)
      : selectedPlan.price
    : 0

  function applyPromo() {
    if (!promoCode.trim()) return
    startPromo(async () => {
      const { data, error } = await (supabase as any).rpc('apply_promo_code', {
        p_code:       promoCode.trim(),
        p_trainer_id: trainer.id,
      })
      if (error || !data || data.length === 0) {
        toast.error(t('errorInvalidPromo'))
        return
      }
      const promo = data[0]
      setPromoApplied({ discount_pct: promo.discount_pct, code: promoCode.trim() })
      toast.success(t('successPromoApplied', { pct: promo.discount_pct }))
    })
  }

  function subscribe() {
    if (!userId) {
      router.push('/auth/login')
      return
    }
    if (!selectedPlan) return

    startSubscribe(async () => {
      const { data: sub, error: subErr } = await (supabase as any)
        .from('subscriptions')
        .insert({
          subscriber_id:  userId,
          trainer_id:     trainer.id,
          plan_id:        selectedPlan.id,
          status:         'pending',
          payment_method: paymentMethod,
          promo_code_id:  null,
        })
        .select('id')
        .single()

      if (subErr) {
        toast.error(t('errorSubscribe'))
        return
      }

      await (supabase as any).from('payments').insert({
        subscription_id: sub.id,
        amount:          discountedPrice,
        currency:        selectedPlan.currency,
        method:          paymentMethod,
        status:          'pending',
      })

      router.push(`/checkout/${sub.id}?method=${paymentMethod}`)
    })
  }

  const statusLabel = existingSubscription?.status === 'active'    ? t('statusActive')
                    : existingSubscription?.status === 'expiring'  ? t('statusExpiring')
                    : t('statusPending')

  const features = [
    t('feature1'), t('feature2'), t('feature3'),
    t('feature4'), t('feature5'), t('feature6'),
  ]

  const paymentMethods = [
    { id: 'tap'    as const, label: t('methodCard'),   sub: 'Visa / Mastercard / Mada' },
    { id: 'tabby'  as const, label: t('methodTabby'),  sub: `${installmentAmount(discountedPrice, 4)} ${t('perMonth')}` },
    { id: 'tamara' as const, label: t('methodTamara'), sub: `${installmentAmount(discountedPrice, 3)} ${t('perMonth')}` },
  ]

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">
        <Link href="/trainers" className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors w-fit">
          <ArrowLeft size={15} />
          {t('backToTrainers')}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT — trainer info */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div className="card p-6">
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-surface-200 shrink-0">
                  {trainer.avatar_url ? (
                    <Image
                      src={trainer.avatar_url}
                      alt={trainer.full_name}
                      width={80} height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand font-bold text-2xl">
                      {getInitials(trainer.full_name)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h1 className="text-xl font-bold text-white">{trainer.full_name}</h1>
                      {trainer.specialty && (
                        <p className="text-brand text-sm font-medium">{trainer.specialty}</p>
                      )}
                      <p className="text-xs text-muted mt-1">
                        {trainer.country} · {t('yearsExp', { n: trainer.years_experience })}
                      </p>
                    </div>
                    {trainer.is_featured && (
                      <span className="badge badge-brand shrink-0">{t('featuredBadge')}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-5 mt-4 flex-wrap">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Star size={14} className="text-warning fill-warning" />
                      <span className="text-white font-semibold">{trainer.rating?.toFixed(1) ?? '—'}</span>
                      {trainer.rating_count > 0 && (
                        <span className="text-muted text-xs">{t('ratingCount', { n: trainer.rating_count })}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted">
                      <Users size={14} />
                      <span>{t('subscribersCount', { n: trainer.subscribers_count })}</span>
                    </div>
                    {trainer.years_experience >= 5 && (
                      <div className="flex items-center gap-1.5 text-sm text-brand">
                        <Award size={14} />
                        <span>{t('expertTrainer')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {(trainer.bio_ar || trainer.bio) && (
              <div className="card p-5">
                <h2 className="text-sm font-semibold text-white mb-3">{t('bioTitle')}</h2>
                <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">
                  {trainer.bio_ar ?? trainer.bio}
                </p>
              </div>
            )}

            <div className="card p-5">
              <h2 className="text-sm font-semibold text-white mb-4">{t('whatYouGetTitle')}</h2>
              <ul className="flex flex-col gap-3">
                {features.map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 size={16} className="text-brand shrink-0" />
                    <span className="text-muted">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RIGHT — subscription widget */}
          <div className="flex flex-col gap-4">
            {existingSubscription ? (
              <div className="card p-5 text-center flex flex-col gap-4">
                <CheckCircle2 size={32} className="text-brand mx-auto" />
                <p className="text-white font-semibold">{t('alreadySubscribed')}</p>
                <p className="text-xs text-muted">{t('statusLabel', { s: statusLabel })}</p>
                <Link href="/dashboard" className="btn-brand w-full text-center">
                  {t('goToDashboard')}
                </Link>
              </div>
            ) : (
              <>
                <div className="card p-5 flex flex-col gap-4">
                  <h2 className="text-sm font-semibold text-white">{t('choosePlan')}</h2>
                  {plans.length === 0 ? (
                    <p className="text-sm text-muted">{t('noPlansAvailable')}</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {plans.map(plan => (
                        <button
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan)}
                          className={cn(
                            'w-full p-3 rounded-xl border text-start transition-colors',
                            selectedPlan?.id === plan.id
                              ? 'border-brand bg-brand/5'
                              : 'border-white/[0.08] hover:border-white/20'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-white">
                              {plan.name_ar ?? plan.name}
                            </p>
                            <p className="text-brand font-bold text-sm">
                              {plan.price} {plan.currency}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted">
                            <Clock size={11} />
                            {t('days', { n: plan.duration_days })}
                          </div>
                          {(plan.description_ar ?? plan.description) && (
                            <p className="text-xs text-muted mt-1 line-clamp-2">
                              {plan.description_ar ?? plan.description}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedPlan && (
                  <>
                    <div className="card p-5 flex flex-col gap-3">
                      <h2 className="text-sm font-semibold text-white">{t('paymentMethod')}</h2>
                      {paymentMethods.map(m => (
                        <button
                          key={m.id}
                          onClick={() => setPaymentMethod(m.id)}
                          className={cn(
                            'w-full p-3 rounded-xl border text-start transition-colors',
                            paymentMethod === m.id
                              ? 'border-brand bg-brand/5'
                              : 'border-white/[0.08] hover:border-white/20'
                          )}
                        >
                          <p className="text-sm font-medium text-white">{m.label}</p>
                          <p className="text-xs text-muted">{m.sub}</p>
                        </button>
                      ))}
                    </div>

                    <div className="card p-5 flex flex-col gap-3">
                      <h2 className="text-sm font-semibold text-white">{t('promoCodeTitle')}</h2>
                      {promoApplied ? (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-brand/10 border border-brand/20">
                          <span className="text-sm text-brand font-medium">{promoApplied.code}</span>
                          <span className="text-sm text-brand">−{promoApplied.discount_pct}%</span>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            value={promoCode}
                            onChange={e => setPromoCode(e.target.value.toUpperCase())}
                            placeholder={t('promoPlaceholder')}
                            className="input flex-1 text-sm py-1.5"
                            dir="ltr"
                          />
                          <button
                            onClick={applyPromo}
                            disabled={promoLoading || !promoCode.trim()}
                            className="btn-outline text-sm px-3 py-1.5 whitespace-nowrap"
                          >
                            {t('applyBtn')}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="card p-5 flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted">{t('planLabel')}</span>
                          <span className="text-white">{selectedPlan.price} {selectedPlan.currency}</span>
                        </div>
                        {promoApplied && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted">{t('discountLabel')}</span>
                            <span className="text-brand">−{promoApplied.discount_pct}%</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-semibold border-t border-white/[0.06] pt-2 mt-1">
                          <span className="text-white">{t('totalLabel')}</span>
                          <span className="text-brand text-base">
                            {discountedPrice.toFixed(2)} {selectedPlan.currency}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={subscribe}
                        disabled={subscribing || plans.length === 0}
                        className="btn-brand w-full flex items-center justify-center gap-2"
                      >
                        {subscribing ? (
                          <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                          <CreditCard size={15} />
                        )}
                        {subscribing ? t('processing') : t('subscribeBtn')}
                      </button>

                      {!userId && (
                        <p className="text-xs text-center text-muted">
                          {t('loginRequiredPrefix')}{' '}
                          <Link href="/auth/login" className="text-brand hover:underline">{t('loginLink')}</Link>
                          {' '}{t('loginRequiredSuffix')}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
