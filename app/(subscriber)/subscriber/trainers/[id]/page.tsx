import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { TrainerProfileClient } from './TrainerProfileClient'

interface PageProps { params: Promise<{ id: string }> }

export default async function TrainerProfilePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const locale   = await getLocale()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: trainer } = await (supabase as any)
    .from('trainers')
    .select(`
      id, specialty, bio, bio_ar, years_experience, rating, rating_count, subscribers_count,
      profiles!profile_id(full_name, avatar_url),
      trainer_plans(id, name, name_ar, description, description_ar, duration_days, price, currency, active),
      transformations(id, before_url, after_url, caption, caption_ar, sort_order)
    `)
    .eq('id', id)
    .eq('approval_status', 'approved')
    .single()

  if (!trainer) notFound()

  const { data: sub } = await (supabase as any)
    .from('subscriptions')
    .select('id, status, plan_id')
    .eq('subscriber_id', user.id)
    .eq('trainer_id', id)
    .in('status', ['active', 'expiring'])
    .maybeSingle()

  const plans = ((trainer.trainer_plans ?? []) as any[])
    .filter((p: any) => p.active)
    .sort((a: any, b: any) => a.price - b.price)

  const transformations = ((trainer.transformations ?? []) as any[])
    .sort((a: any, b: any) => a.sort_order - b.sort_order)

  return (
    <TrainerProfileClient
      trainer={trainer}
      plans={plans}
      transformations={transformations}
      activePlanId={sub?.plan_id ?? null}
      locale={locale}
    />
  )
}
