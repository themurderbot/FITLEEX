import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { TransformationsClient } from './TransformationsClient'

export const metadata = { title: 'Transformations' }

export default async function TrainerTransformationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: trainer } = await (supabase as any)
    .from('trainers')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!trainer) redirect('/')

  const { data: transformations } = await (supabase as any)
    .from('transformations')
    .select('id, before_url, after_url, caption, caption_ar, sort_order')
    .eq('trainer_id', trainer.id)
    .order('sort_order', { ascending: true })

  return (
    <TransformationsClient
      trainerId={trainer.id}
      initial={transformations ?? []}
    />
  )
}
