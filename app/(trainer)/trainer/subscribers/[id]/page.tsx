import { redirect, notFound } from 'next/navigation'
import { createClient }       from '@/lib/supabase/server'
import { getLocale }          from 'next-intl/server'
import { SubscriberProfileClient } from './SubscriberProfileClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Subscriber Profile' }

interface PageProps { params: Promise<{ id: string }> }

export default async function SubscriberProfilePage({ params }: PageProps) {
  const { id: subscriberId } = await params
  const locale  = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await (supabase as any).auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: trainerRaw } = await (supabase as any)
    .from('trainers').select('id').eq('profile_id', user.id).single()
  const trainer = trainerRaw as any
  if (!trainer) redirect('/')

  const { data: subscriptionRaw } = await (supabase as any)
    .from('subscriptions')
    .select('id, status, start_date, end_date, trainer_plans(name, duration_days)')
    .eq('subscriber_id', subscriberId)
    .eq('trainer_id', trainer.id)
    .order('start_date', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()
  const subscription = subscriptionRaw as any

  if (!subscription) notFound()

  const [
    { data: profile },
    { data: workoutPlan },
    { data: nutritionPlan },
    { data: submissions },
  ] = await Promise.all([
    (supabase as any).from('profiles').select('full_name, avatar_url, country').eq('id', subscriberId).single(),

    (supabase as any)
      .from('workout_plans')
      .select('id, week_number, workout_days(id, day_number, label, exercises(id, name, sets, reps, rest_seconds, sort_order))')
      .eq('subscription_id', subscription.id)
      .order('week_number', { ascending: false })
      .limit(1)
      .maybeSingle(),

    (supabase as any)
      .from('nutrition_plans')
      .select('id, meals(id, meal_time, name, kcal, protein_g, carbs_g, fat_g, sort_order)')
      .eq('subscription_id', subscription.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),

    (supabase as any)
      .from('progress_submissions')
      .select('id, week_number, weight_kg, photos, notes, reviewed, submitted_at, trainer_feedback(message, created_at)')
      .eq('subscription_id', subscription.id)
      .order('week_number', { ascending: false }),
  ])

  if (!profile) notFound()

  return (
    <SubscriberProfileClient
      subscriberId={subscriberId}
      subscriptionId={subscription.id}
      subscriptionStatus={subscription.status ?? 'active'}
      startDate={subscription.start_date ?? null}
      plan={(subscription.trainer_plans as any) ?? null}
      profile={profile as any}
      workoutPlan={workoutPlan as any}
      nutritionPlan={nutritionPlan as any}
      submissions={(submissions ?? []) as any[]}
      locale={locale}
    />
  )
}
