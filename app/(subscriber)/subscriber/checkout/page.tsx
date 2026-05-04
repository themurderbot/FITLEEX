import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { CheckoutClient } from './CheckoutClient'

interface PageProps { searchParams: Promise<{ planId?: string; trainerId?: string }> }

export default async function CheckoutPage({ searchParams }: PageProps) {
  const { planId, trainerId } = await searchParams
  if (!planId || !trainerId) notFound()

  const supabase = await createClient()
  const locale   = await getLocale()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Already subscribed or pending payment?
  const { data: existingSub } = await (supabase as any)
    .from('subscriptions')
    .select('id, status')
    .eq('subscriber_id', user.id)
    .eq('trainer_id', trainerId)
    .in('status', ['active', 'expiring', 'pending'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingSub?.status === 'pending') redirect(`/checkout/${existingSub.id}`)
  if (existingSub) redirect('/subscriber/plan')

  const { data: plan } = await (supabase as any)
    .from('trainer_plans')
    .select('id, name, name_ar, description, description_ar, duration_days, price, currency, trainer_id')
    .eq('id', planId)
    .eq('active', true)
    .single()

  if (!plan) notFound()

  const { data: trainer } = await (supabase as any)
    .from('trainers')
    .select('id, specialty, profiles!profile_id(full_name)')
    .eq('id', trainerId)
    .single()

  if (!trainer) notFound()

  return (
    <CheckoutClient
      plan={plan}
      trainer={trainer}
      userId={user.id}
      locale={locale}
    />
  )
}
