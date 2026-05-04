'use server'

import { redirect }          from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createTapCharge }   from './tap'
import { createTabbySession } from './tabby'
import { createTamaraSession } from './tamara'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

export async function initiatePayment(subscriptionId: string) {
  const supabase      = await createClient()
  const adminSupabase = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch subscription + plan + profile
  const { data: sub, error: subErr } = await (supabase as any)
    .from('subscriptions')
    .select(`
      id, status, payment_method,
      trainer_plans!inner(name, price, currency, duration_days),
      profiles!subscriptions_subscriber_id_fkey!inner(full_name, phone)
    `)
    .eq('id', subscriptionId)
    .eq('subscriber_id', user.id)
    .eq('status', 'pending')
    .single()

  if (subErr || !sub) redirect('/dashboard')

  const plan    = (sub as any).trainer_plans
  const profile = (sub as any).profiles

  // Fetch payment record to get final amount (may have promo discount)
  const { data: payment } = await (adminSupabase as any)
    .from('payments')
    .select('id, amount, currency')
    .eq('subscription_id', subscriptionId)
    .eq('status', 'pending')
    .single()

  const amount   = (payment as any)?.amount ?? plan.price
  const currency = (payment as any)?.currency ?? plan.currency

  const successUrl = `${APP_URL}/checkout/success?sub=${subscriptionId}`
  const failureUrl = `${APP_URL}/checkout/failed?sub=${subscriptionId}`
  const cancelUrl  = `${APP_URL}/checkout/${subscriptionId}`

  const method: string = (sub as any).payment_method ?? 'tap'

  try {
    if (method === 'tap') {
      const charge = await createTapCharge({
        amount,
        currency,
        description:    plan.name,
        subscriptionId,
        customerId:     user.id,
        customerName:   profile.full_name,
        customerEmail:  user.email!,
        customerPhone:  profile.phone ?? undefined,
        redirectUrl:    successUrl,
      })

      // Store tap charge id
      await (adminSupabase as any)
        .from('payments')
        .update({ tap_charge_id: charge.id })
        .eq('subscription_id', subscriptionId)
        .eq('status', 'pending')

      redirect(charge.transaction.url)

    } else if (method === 'tabby') {
      const url = await createTabbySession({
        amount,
        currency,
        description:   plan.name,
        subscriptionId,
        customerName:  profile.full_name,
        customerEmail: user.email!,
        customerPhone: profile.phone ?? '0500000000',
        successUrl,
        cancelUrl,
        failureUrl,
      })
      redirect(url)

    } else if (method === 'tamara') {
      const session = await createTamaraSession({
        amount,
        currency,
        description:     plan.name,
        subscriptionId,
        customerName:    profile.full_name,
        customerEmail:   user.email!,
        customerPhone:   profile.phone ?? '0500000000',
        successUrl,
        cancelUrl,
        failureUrl,
        notificationUrl: `${APP_URL}/api/webhooks/tamara`,
      })
      redirect(session.checkout_url)
    }
  } catch (err: any) {
    // If error is NEXT_REDIRECT rethrow it
    if (err?.digest?.startsWith('NEXT_REDIRECT')) throw err
    redirect(`/checkout/failed?sub=${subscriptionId}&reason=gateway`)
  }

  redirect(`/checkout/failed?sub=${subscriptionId}`)
}
