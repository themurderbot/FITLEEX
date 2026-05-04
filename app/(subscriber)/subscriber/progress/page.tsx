import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { getLocale }    from 'next-intl/server'
import { ProgressClient } from './ProgressClient'

export const metadata = { title: 'My Progress — FITLEEX' }

interface PageProps { searchParams: Promise<{ sub?: string }> }

export default async function SubscriberProgressPage({ searchParams }: PageProps) {
  const { sub } = await searchParams
  const supabase = await createClient()
  const locale   = await getLocale()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: subs } = await (supabase as any)
    .from('subscriptions')
    .select(`
      id,
      trainers!trainer_id(profiles!profile_id(full_name))
    `)
    .eq('subscriber_id', user.id)
    .in('status', ['active', 'expiring'])

  const activeSubId = sub ?? (subs as any[])?.[0]?.id ?? null

  const { data: submissions } = activeSubId
    ? await (supabase as any)
        .from('progress_submissions')
        .select('id, week_number, weight_kg, photos, notes, reviewed, submitted_at, trainer_feedback(message, created_at)')
        .eq('subscription_id', activeSubId)
        .order('week_number', { ascending: false })
    : { data: [] }

  return (
    <ProgressClient
      subscriptions={(subs ?? []) as any[]}
      activeSubId={activeSubId ?? undefined}
      submissions={submissions ?? []}
      currentUserId={user.id}
      locale={locale}
    />
  )
}
