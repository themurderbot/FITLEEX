'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Tag, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const PAYMENT_METHODS = [
  {
    id: 'tap',
    labelEn: 'Credit / Debit Card',
    labelAr: 'بطاقة ائتمان / مدين',
    icon: '💳',
    noteEn: 'Visa, Mastercard, Mada',
    noteAr: 'فيزا، ماستركارد، مدى',
  },
  {
    id: 'tabby',
    labelEn: 'Tabby — 4 payments',
    labelAr: 'تابي — 4 دفعات',
    icon: '🟣',
    noteEn: '0% interest, paid monthly',
    noteAr: 'بدون فوائد، شهرياً',
  },
  {
    id: 'tamara',
    labelEn: 'Tamara — 3 payments',
    labelAr: 'تمارا — 3 دفعات',
    icon: '🟢',
    noteEn: '0% interest, paid monthly',
    noteAr: 'بدون فوائد، شهرياً',
  },
]

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

interface Props {
  plan:    any
  trainer: any
  userId:  string
  locale:  string
}

export function CheckoutClient({ plan, trainer, userId, locale }: Props) {
  const supabase = createClient()
  const router   = useRouter()
  const lbl = (en: string, ar: string) => locale === 'ar' ? ar : en

  const [method,     setMethod]     = useState('tap')
  const [promoCode,  setPromoCode]  = useState('')
  const [promoState, setPromoState] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [discount,   setDiscount]   = useState(0)
  const [promoId,    setPromoId]    = useState<string | null>(null)
  const [pending,    startTrans]    = useTransition()

  const originalPrice = plan.price as number
  const discountAmt   = Math.floor(originalPrice * discount / 100)
  const finalPrice    = originalPrice - discountAmt

  const installment = (n: number) => (finalPrice / n).toFixed(0)

  async function applyPromo() {
    if (!promoCode.trim()) return
    setPromoState('checking')
    const { data } = await (supabase as any)
      .from('promo_codes')
      .select('id, discount_pct, max_uses, uses_count, expires_at, active')
      .eq('code', promoCode.trim().toUpperCase())
      .eq('trainer_id', trainer.id)
      .single()

    if (
      data &&
      data.active &&
      (!data.expires_at || new Date(data.expires_at) > new Date()) &&
      (!data.max_uses || data.uses_count < data.max_uses)
    ) {
      setDiscount(data.discount_pct)
      setPromoId(data.id)
      setPromoState('valid')
    } else {
      setDiscount(0)
      setPromoId(null)
      setPromoState('invalid')
    }
  }

  const [err, setErr] = useState<string | null>(null)

  function handleConfirm() {
    setErr(null)
    startTrans(async () => {
      const { data: sub, error } = await (supabase as any)
        .from('subscriptions')
        .insert({
          subscriber_id:  userId,
          trainer_id:     trainer.id,
          plan_id:        plan.id,
          status:         'pending',
          payment_method: method,
          promo_code_id:  promoId,
        })
        .select('id')
        .single()

      if (error || !sub) {
        setErr(lbl('Failed to create subscription. Please try again.', 'فشل إنشاء الاشتراك. حاول مجدداً.'))
        return
      }

      // Record pending payment with final (discounted) amount
      const { error: payErr } = await (supabase as any).from('payments').insert({
        subscription_id: sub.id,
        amount:          finalPrice,
        currency:        plan.currency,
        method:          method,
        status:          'pending',
      })

      if (payErr) {
        // Clean up the subscription if payment record failed
        await (supabase as any).from('subscriptions').delete().eq('id', sub.id)
        setErr(lbl('Failed to initiate payment. Please try again.', 'فشل بدء الدفع. حاول مجدداً.'))
        return
      }

      // Increment promo uses
      if (promoId) {
        await (supabase as any).rpc('increment_promo_uses', { promo_id: promoId })
      }

      // Redirect to real payment gateway
      router.push(`/checkout/${sub.id}`)
    })
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/subscriber/trainers/${trainer.id}`}
          className="flex items-center justify-center rounded-xl transition-colors hover:bg-white/5"
          style={{ width: 36, height: 36, background: '#141414', border: '1px solid #222' }}>
          <ArrowLeft size={16} style={{ color: '#888' }} />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white leading-none">{lbl('CHECKOUT', 'الدفع')}</h1>
          <p className="text-xs mt-0.5" style={{ color: '#555' }}>
            {lbl('Review and confirm', 'راجع وأكد اشتراكك')}
          </p>
        </div>
      </div>

      {/* Plan summary card */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#141414', border: '1px solid #222' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg,#C8F04B,#7ab82e)' }} />
        <div className="p-4 flex items-center gap-3">
          <div style={{
            width: 52, height: 52, borderRadius: 16, flexShrink: 0,
            background: 'linear-gradient(135deg,#C8F04B,#7ab82e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 18, color: '#000',
          }}>
            {initials(trainer.profiles?.full_name ?? '?')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-white text-sm leading-tight">
              {locale === 'ar' ? (plan.name_ar || plan.name) : plan.name}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#888' }}>
              {trainer.profiles?.full_name} · {plan.duration_days} {lbl('days', 'يوم')}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-mono font-black text-white text-lg leading-none">{originalPrice}</p>
            <p className="text-[10px]" style={{ color: '#555' }}>{plan.currency}</p>
          </div>
        </div>
      </div>

      {/* Promo code */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: '#888' }}>
          <Tag size={12} /> {lbl('Promo Code', 'كود الخصم')}
        </label>
        <div className="flex gap-2">
          <input
            value={promoCode}
            onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoState('idle') }}
            placeholder={lbl('Enter code...', 'أدخل الكود...')}
            className="flex-1 rounded-xl text-sm text-white font-mono"
            style={{
              background: '#141414',
              border: `1px solid ${promoState === 'valid' ? 'rgba(76,175,80,0.5)' : promoState === 'invalid' ? 'rgba(255,77,77,0.5)' : '#222'}`,
              padding: '11px 14px', outline: 'none',
            }}
          />
          <button
            onClick={applyPromo}
            disabled={!promoCode.trim() || promoState === 'checking'}
            className="px-4 rounded-xl text-sm font-black transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: '#C8F04B', color: '#000', flexShrink: 0 }}>
            {promoState === 'checking' ? '...' : lbl('Apply', 'تطبيق')}
          </button>
        </div>
        {promoState === 'valid' && (
          <p className="text-xs flex items-center gap-1" style={{ color: '#4CAF50' }}>
            <CheckCircle2 size={12} /> {lbl(`${discount}% discount applied!`, `خصم ${discount}٪ تم تطبيقه!`)}
          </p>
        )}
        {promoState === 'invalid' && (
          <p className="text-xs" style={{ color: '#FF4D4D' }}>
            {lbl('Invalid or expired code', 'الكود غير صالح أو منتهي')}
          </p>
        )}
      </div>

      {/* Payment method */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold" style={{ color: '#888' }}>
          {lbl('Payment Method', 'طريقة الدفع')}
        </p>
        <div className="flex flex-col gap-2">
          {PAYMENT_METHODS.map(m => {
            const active = method === m.id
            const note = locale === 'ar' ? m.noteAr : m.noteEn
            const installmentNote =
              m.id === 'tabby'  ? `${plan.currency} ${installment(4)} × 4` :
              m.id === 'tamara' ? `${plan.currency} ${installment(3)} × 3` : null
            return (
              <button key={m.id} onClick={() => setMethod(m.id)}
                className="flex items-center gap-3 rounded-2xl p-4 text-left transition-all"
                style={{
                  background: active ? 'rgba(200,240,75,0.06)' : '#141414',
                  border: `1px solid ${active ? 'rgba(200,240,75,0.3)' : '#222'}`,
                }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{m.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">
                    {locale === 'ar' ? m.labelAr : m.labelEn}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: '#555' }}>
                    {installmentNote ?? note}
                  </p>
                </div>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${active ? '#C8F04B' : '#333'}`,
                  background: active ? '#C8F04B' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#000' }} />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Price breakdown */}
      <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: '#141414', border: '1px solid #222' }}>
        <div className="flex justify-between text-sm">
          <span style={{ color: '#666' }}>{lbl('Subtotal', 'المجموع')}</span>
          <span className="text-white font-mono">{plan.currency} {originalPrice}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span style={{ color: '#4CAF50' }}>{lbl(`Discount (${discount}%)`, `خصم (${discount}٪)`)}</span>
            <span className="font-mono font-bold" style={{ color: '#4CAF50' }}>− {plan.currency} {discountAmt}</span>
          </div>
        )}
        <div style={{ height: 1, background: '#222', margin: '2px 0' }} />
        <div className="flex justify-between">
          <span className="font-black text-white">{lbl('Total', 'الإجمالي')}</span>
          <span className="font-mono font-black text-white text-lg">{plan.currency} {finalPrice}</span>
        </div>
        {method === 'tabby' && (
          <p className="text-[11px] text-center mt-1" style={{ color: '#888' }}>
            {lbl(`4 × ${plan.currency} ${installment(4)} / month`, `4 × ${plan.currency} ${installment(4)} / شهر`)}
          </p>
        )}
        {method === 'tamara' && (
          <p className="text-[11px] text-center mt-1" style={{ color: '#888' }}>
            {lbl(`3 × ${plan.currency} ${installment(3)} / month`, `3 × ${plan.currency} ${installment(3)} / شهر`)}
          </p>
        )}
      </div>

      {/* Error */}
      {err && (
        <div className="rounded-xl px-4 py-3 text-sm text-center" style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', color: '#FF4D4D' }}>
          {err}
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={pending}
        className="w-full py-4 rounded-2xl font-black text-base transition-opacity hover:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: '#C8F04B', color: '#000' }}>
        {pending
          ? <><Loader2 size={18} className="animate-spin" /> {lbl('Processing...', 'جاري المعالجة...')}</>
          : <>{lbl('Confirm & Subscribe', 'تأكيد الاشتراك')} <ChevronRight size={18} /></>
        }
      </button>

      <p className="text-center text-[11px]" style={{ color: '#444' }}>
        {lbl('By subscribing you agree to our terms of service', 'بالاشتراك توافق على شروط الخدمة')}
      </p>
    </div>
  )
}
