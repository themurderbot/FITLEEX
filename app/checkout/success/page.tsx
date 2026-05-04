import { createClient }    from '@/lib/supabase/server'
import { redirect }        from 'next/navigation'
import Link                from 'next/link'
import { CheckCircle2 }    from 'lucide-react'
import { getTranslations } from 'next-intl/server'

interface PageProps { searchParams: Promise<{ sub?: string; tap_id?: string }> }

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const { sub, tap_id } = await searchParams
  const t = await getTranslations('checkout')

  if (tap_id && sub) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user && sub) {
      const res = await fetch(`https://api.tap.company/v2/charges/${tap_id}`, {
        headers: { Authorization: `Bearer ${process.env.TAP_SECRET_KEY}` },
      })
      const charge = res.ok ? await res.json() : null

      if (charge?.status === 'CAPTURED') {
        await (supabase as any).rpc('activate_subscription_on_payment', {
          p_subscription_id: sub,
          p_tap_charge_id:   tap_id,
        })
      } else {
        redirect(`/checkout/failed?sub=${sub}&reason=not_captured`)
      }
    }
  }

  const steps = [t('nextStep1'), t('nextStep2'), t('nextStep3')]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 size={40} className="text-success" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('successTitle')}</h1>
          <p className="text-muted text-sm leading-relaxed">{t('successBody')}</p>
        </div>

        <div className="card p-5 w-full text-start flex flex-col gap-3">
          <p className="text-xs text-muted font-medium">{t('nextStepsLabel')}</p>
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-muted">
              <span className="w-5 h-5 rounded-full bg-brand/10 text-brand text-xs
                               flex items-center justify-center shrink-0 font-bold">
                {i + 1}
              </span>
              {step}
            </div>
          ))}
        </div>

        <Link href="/dashboard" className="btn-brand w-full text-center">
          {t('gotoDashboard')}
        </Link>
      </div>
    </div>
  )
}
