import { createClient }    from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { CheckoutClient }  from './CheckoutClient'

interface PageProps { params: Promise<{ id: string }> }

export default async function CheckoutPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: sub } = await (supabase as any)
    .from('subscriptions')
    .select(`
      id, status, payment_method, created_at,
      trainer_plans!inner(name, name_ar, price, currency, duration_days),
      trainers!inner(
        profiles!inner(full_name, avatar_url)
      )
    `)
    .eq('id', id)
    .eq('subscriber_id', user.id)
    .single()

  if (!sub) notFound()

  // Already active — redirect to subscriber plan
  if ((sub as any).status === 'active') redirect('/subscriber/plan')

  // Fetch payment to get discounted amount
  const { data: payment } = await (supabase as any)
    .from('payments')
    .select('amount, currency')
    .eq('subscription_id', id)
    .eq('status', 'pending')
    .maybeSingle()

  const plan    = (sub as any).trainer_plans
  const trainer = (sub as any).trainers?.profiles

  return (
    <CheckoutClient
      subscriptionId={id}
      plan={{
        name:         plan.name_ar ?? plan.name,
        price:        plan.price,
        currency:     plan.currency,
        duration_days: plan.duration_days,
      }}
      trainerName={trainer?.full_name ?? ''}
      trainerAvatar={trainer?.avatar_url ?? null}
      paymentMethod={(sub as any).payment_method ?? 'tap'}
      finalAmount={payment?.amount ?? plan.price}
      currency={payment?.currency ?? plan.currency}
    />
  )
}
