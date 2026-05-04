import { createClient }  from '@/lib/supabase/server'
import { TrainersClient } from './TrainersClient'
import type { TrainerWithProfile, TrainerPlan } from '@/types/database'

export const metadata = { title: 'Trainers — FITLEEX' }

export interface TrainerCard {
  id:                string
  profile_id:        string
  specialty:         string | null
  bio:               string | null
  bio_ar:            string | null
  years_experience:  number
  rating:            number | null
  rating_count:      number
  subscribers_count: number
  is_featured:       boolean
  full_name:         string
  avatar_url:        string | null
  country:           string
  min_price:         number | null
  min_duration:      number | null
}

export default async function TrainersPage() {
  const supabase = await createClient()

  const { data: trainers } = await supabase
    .from('trainers')
    .select(`
      id, profile_id, specialty, bio, bio_ar,
      years_experience, rating, rating_count, subscribers_count, is_featured,
      profiles!inner(full_name, avatar_url, country),
      trainer_plans(price, duration_days, active)
    `)
    .eq('approval_status', 'approved')
    .order('is_featured', { ascending: false })
    .order('rating', { ascending: false })

  const cards: TrainerCard[] = (trainers ?? []).map((t: any) => {
    const plans = (t.trainer_plans ?? []).filter((p: any) => p.active)
    return {
      id:                t.id,
      profile_id:        t.profile_id,
      specialty:         t.specialty,
      bio:               t.bio,
      bio_ar:            t.bio_ar,
      years_experience:  t.years_experience,
      rating:            t.rating,
      rating_count:      t.rating_count,
      subscribers_count: t.subscribers_count,
      is_featured:       t.is_featured,
      full_name:         t.profiles.full_name,
      avatar_url:        t.profiles.avatar_url,
      country:           t.profiles.country,
      min_price:         plans.length ? Math.min(...plans.map((p: any) => p.price)) : null,
      min_duration:      plans.length ? Math.min(...plans.map((p: any) => p.duration_days)) : null,
    }
  })

  const specialties = Array.from(new Set(cards.map(c => c.specialty).filter(Boolean))) as string[]

  return <TrainersClient trainers={cards} specialties={specialties} />
}
