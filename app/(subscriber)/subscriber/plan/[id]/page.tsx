import { createClient }        from '@/lib/supabase/server'
import { notFound, redirect }   from 'next/navigation'
import { getLocale }            from 'next-intl/server'
import { PlanClient }           from './PlanClient'

interface PageProps { params: Promise<{ id: string }> }

export default async function SubscriberPlanPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const locale   = await getLocale()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: plan } = await (supabase as any)
    .from('workout_plans')
    .select(`
      id, week_number,
      subscriptions!inner(id, subscriber_id, start_date),
      trainers!trainer_id(profiles!profile_id(full_name)),
      workout_days(
        id, day_number, label,
        exercises(id, name, name_ar, sets, reps, rest_seconds, sort_order, video_url)
      )
    `)
    .eq('id', id)
    .single()

  if (!plan) notFound()
  if ((plan as any).subscriptions?.subscriber_id !== user.id) notFound()

  const subId = (plan as any).subscriptions?.id

  const { data: nutritionRaw } = await (supabase as any)
    .from('nutrition_plans')
    .select('id, meals(id, meal_time, name, name_ar, ingredients, preparation_steps, kcal, protein_g, carbs_g, fat_g, sort_order, photo_urls)')
    .eq('subscription_id', subId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  const { data: submissions } = await (supabase as any)
    .from('progress_submissions')
    .select('id, week_number, weight_kg, notes, photos, reviewed, submitted_at, trainer_feedback(message, created_at)')
    .eq('subscription_id', subId)
    .order('week_number', { ascending: false })

  const allSubs = (submissions ?? []) as any[]

  // Count total plans across all this subscriber's subscriptions (to decide if back arrow is needed)
  const { count: totalPlans } = await (supabase as any)
    .from('workout_plans')
    .select('id', { count: 'exact', head: true })
    .in('subscription_id',
      ((await (supabase as any)
        .from('subscriptions')
        .select('id')
        .eq('subscriber_id', user.id)
        .in('status', ['active', 'expiring'])
      ).data ?? []).map((s: any) => s.id)
    )

  const days = (((plan as any).workout_days ?? []) as any[])
    .sort((a: any, b: any) => a.day_number - b.day_number)
    .map((d: any) => ({
      ...d,
      exercises: (d.exercises ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    }))

  const meals = (((nutritionRaw as any)?.meals ?? []) as any[])
    .sort((a: any, b: any) => a.sort_order - b.sort_order)

  return (
    <PlanClient
      planId={id}
      weekNumber={(plan as any).week_number}
      startDate={(plan as any).subscriptions?.start_date ?? null}
      trainerName={(plan as any).trainers?.profiles?.full_name ?? ''}
      days={days}
      meals={meals}
      submissions={allSubs}
      showBack={(totalPlans ?? 0) > 1}
      locale={locale}
    />
  )
}
