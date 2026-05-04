import { createClient }       from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { TrainerProfileClient } from './TrainerProfileClient'

interface PageProps { params: Promise<{ id: string }> }

export default async function TrainerProfilePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: trainer } = await (supabase as any)
    .from('trainers')
    .select(`
      id, specialty, bio, bio_ar, years_experience,
      rating, rating_count, subscribers_count, is_featured,
      profiles!inner(full_name, avatar_url, country),
      trainer_plans(id, name, name_ar, description, description_ar, duration_days, price, currency, active)
    `)
    .eq('id', id)
    .eq('approval_status', 'approved')
    .single()

  if (!trainer) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  // Check if subscriber already has an active sub with this trainer
  let existingSubscription = null
  if (user) {
    const { data } = await supabase
      .from('subscriptions')
      .select('id, status, end_date')
      .eq('subscriber_id', user.id)
      .eq('trainer_id', id)
      .in('status', ['active', 'expiring', 'pending'])
      .maybeSingle()
    existingSubscription = data
  }

  const plans = (trainer as any).trainer_plans
    .filter((p: any) => p.active)
    .sort((a: any, b: any) => a.price - b.price)

  return (
    <TrainerProfileClient
      trainer={{
        id:                trainer.id,
        specialty:         trainer.specialty,
        bio:               trainer.bio,
        bio_ar:            trainer.bio_ar,
        years_experience:  trainer.years_experience,
        rating:            trainer.rating,
        rating_count:      trainer.rating_count,
        subscribers_count: trainer.subscribers_count,
        is_featured:       trainer.is_featured,
        full_name:         (trainer as any).profiles.full_name,
        avatar_url:        (trainer as any).profiles.avatar_url,
        country:           (trainer as any).profiles.country,
      }}
      plans={plans}
      userId={user?.id ?? null}
      existingSubscription={existingSubscription}
    />
  )
}
