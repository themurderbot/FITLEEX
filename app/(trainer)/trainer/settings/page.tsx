import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TrainerSettingsClient } from './TrainerSettingsClient'

export const metadata = { title: 'Settings' }

export default async function TrainerSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await (supabase as any).auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: trainer }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('trainers').select('*, trainer_plans(*)').eq('profile_id', user.id).single(),
  ])

  if (!profile || !trainer) redirect('/')

  return (
    <TrainerSettingsClient
      profile={profile}
      trainer={trainer}
      plans={(trainer as { trainer_plans?: unknown[] }).trainer_plans ?? []}
    />
  )
}
