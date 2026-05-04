import { createClient }  from '@/lib/supabase/server'
import { redirect }      from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { VideosClient }  from './VideosClient'
import type { MuscleGroup } from '@/types/database'

export const metadata = { title: 'Video Library' }

export default async function AdminVideosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const t = await getTranslations('admin')

  const muscleLabel: Record<MuscleGroup, string> = {
    chest:     t('muscleChest'),
    back:      t('muscleBack'),
    shoulders: t('muscleShoulders'),
    biceps:    t('muscleArms'),
    triceps:   t('muscleArms'),
    legs:      t('muscleLegs'),
    glutes:    t('muscleLegs'),
    core:      t('muscleCore'),
    cardio:    'Cardio',
    full_body: 'Full Body',
  }

  const { data: videos } = await supabase
    .from('exercise_videos')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <VideosClient
      videos={videos ?? []}
      muscleLabel={muscleLabel}
    />
  )
}
