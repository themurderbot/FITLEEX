import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/trainer/Sidebar'
import { AdminTopbar } from '@/components/admin/AdminTopbar'

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: trainer }] = await Promise.all([
    (supabase as any).from('profiles').select('*').eq('id', user.id).single(),
    (supabase as any).from('trainers').select('*').eq('profile_id', user.id).single(),
  ])

  if (!profile) redirect('/auth/login')
  if ((profile as any).role !== 'trainer') {
    const r = (profile as any).role
    redirect(r === 'subscriber' ? '/subscriber/dashboard' : r === 'admin' ? '/admin/overview' : '/auth/login')
  }
  if (!trainer) redirect('/auth/login?err=no_trainer_record')
  if (trainer?.approval_status === 'pending') redirect('/auth/pending')
  if (trainer?.approval_status === 'rejected') redirect('/auth/pending?rejected=true')

  // Badge counts
  const { data: trainerSubs } = await (supabase as any)
    .from('subscriptions')
    .select('id')
    .eq('trainer_id', (trainer as any)!.id)

  const subIds = ((trainerSubs ?? []) as any[]).map((s: any) => s.id)

  const [{ count: unread }, { count: pending }] = await Promise.all([
    (supabase as any)
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('read', false)
      .neq('sender_id', user.id),
    subIds.length > 0
      ? (supabase as any)
          .from('progress_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('reviewed', false)
          .in('subscription_id', subIds)
      : Promise.resolve({ count: 0 }),
  ])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        profile={profile}
        trainer={trainer!}
        unreadMessages={unread ?? 0}
        pendingReviews={pending ?? 0}
      />
      {/* Main content — always offset from LEFT regardless of locale */}
      <main className="min-h-screen flex flex-col" style={{ marginLeft: 224 }}>
        <AdminTopbar />
        <div className="p-6 flex-1">
          {children}
        </div>
      </main>
    </div>
  )
}
