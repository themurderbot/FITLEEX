import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProgressReviewClient } from './ProgressReviewClient'

export const metadata = { title: 'Progress Review' }

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: trainer } = await (supabase as any)
    .from('trainers').select('id').eq('profile_id', user.id).single()
  if (!trainer) redirect('/')

  const { data: trainerSubs } = await (supabase as any)
    .from('subscriptions')
    .select('id')
    .eq('trainer_id', (trainer as any).id)

  const subIds = ((trainerSubs ?? []) as any[]).map((s: any) => s.id)

  const { data: submissions } = subIds.length > 0
    ? await (supabase as any)
        .from('progress_submissions')
        .select(`
          *,
          profiles!subscriber_id (full_name, avatar_url),
          trainer_feedback (*)
        `)
        .in('subscription_id', subIds)
        .order('submitted_at', { ascending: false })
    : { data: [] }

  return (
    <ProgressReviewClient
      submissions={submissions ?? []}
      trainerId={(trainer as any).id}
    />
  )
}
