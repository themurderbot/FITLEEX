import { redirect } from 'next/navigation'
import { createClient }       from '@/lib/supabase/server'
import { PlanBuilderClient }  from './PlanBuilderClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Plan Builder' }

interface PageProps { searchParams: Promise<{ sub?: string; tab?: string }> }

export default async function PlanBuilderPage({ searchParams }: PageProps) {
  const { sub: subscriptionId, tab } = await searchParams
  if (!subscriptionId) redirect('/trainer/subscribers')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: trainer } = await (supabase as any)
    .from('trainers').select('id').eq('profile_id', user.id).single()
  if (!trainer) redirect('/trainer/subscribers')

  const { data: subscription, error: subError } = await (supabase as any)
    .from('subscriptions')
    .select('id, subscriber_id, plan_id')
    .eq('id', subscriptionId)
    .eq('trainer_id', (trainer as any).id)
    .maybeSingle()
  if (subError) console.error('[PlanBuilder] subscription query error:', subError)
  if (!subscription) {
    console.error('[PlanBuilder] no subscription found — subscriptionId:', subscriptionId, 'trainerId:', (trainer as any).id)
    redirect('/trainer/subscribers')
  }

  const { data: trainerPlan } = await (supabase as any)
    .from('trainer_plans')
    .select('name')
    .eq('id', (subscription as any).plan_id)
    .maybeSingle()

  const { data: subscriberProfile } = await (supabase as any)
    .from('profiles').select('full_name').eq('id', (subscription as any).subscriber_id).single()

  const [{ data: workoutPlan }, { data: nutritionPlan }] = await Promise.all([
    (supabase as any)
      .from('workout_plans')
      .select('id, workout_days(id, day_number, label, exercises(id, name, sets, reps, rest_seconds, sort_order))')
      .eq('subscription_id', subscriptionId)
      .order('week_number', { ascending: false })
      .limit(1)
      .maybeSingle(),

    (supabase as any)
      .from('nutrition_plans')
      .select('id, meals(id, meal_time, name, ingredients, preparation_steps, kcal, protein_g, carbs_g, fat_g, photo_urls, sort_order)')
      .eq('subscription_id', subscriptionId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const initialDays = Array.from({ length: 7 }, (_, i) => {
    const dbDay = (workoutPlan?.workout_days ?? []).find((d: any) => d.day_number === i + 1)
    return {
      dayNum:  i + 1,
      dayName: DAY_NAMES[i],
      label:   dbDay?.label ?? 'Rest',
      exercises: ((dbDay?.exercises ?? []) as any[])
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((e: any) => ({
          name:         e.name,
          sets:         e.sets ?? 3,
          reps:         String(e.reps ?? '12'),
          rest_seconds: e.rest_seconds ?? 60,
          weight_kg:    '',
          order:        e.sort_order ?? 0,
        })),
    }
  })

  const initialMeals = ((nutritionPlan?.meals ?? []) as any[])
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((m: any) => ({
      meal_type:   '',
      time:        m.meal_time ?? '12:00',
      name:        m.name      ?? '',
      ingredients: m.ingredients      ?? '',
      prep_steps:  m.preparation_steps ?? '',
      kcal:        m.kcal      ?? 0,
      protein:     m.protein_g ?? 0,
      carbs:       m.carbs_g   ?? 0,
      fat:         m.fat_g     ?? 0,
      photo_urls:  Array.isArray(m.photo_urls) ? m.photo_urls : [],
    }))

  return (
    <PlanBuilderClient
      subscriptionId={subscriptionId}
      subscriberId={(subscription as any).subscriber_id}
      subscriberName={(subscriberProfile as any)?.full_name ?? 'Subscriber'}
      planName={(trainerPlan as any)?.name ?? 'Plan'}
      trainerId={(trainer as any).id}
      workoutPlanId={workoutPlan?.id ?? null}
      initialDays={initialDays}
      nutritionPlanId={nutritionPlan?.id ?? null}
      initialMeals={initialMeals}
      initialTab={(tab === 'nutrition' ? 'nutrition' : 'workout') as 'workout' | 'nutrition'}
    />
  )
}
