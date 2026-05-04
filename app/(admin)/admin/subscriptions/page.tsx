import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { SubscriptionsClient } from './SubscriptionsClient'

export const metadata = { title: 'Subscriptions' }

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const { status = 'active', page = '1' } = await searchParams
  const supabase  = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const pageNum  = Math.max(1, parseInt(page))
  const pageSize = 20
  const from     = (pageNum - 1) * pageSize
  const to       = from + pageSize - 1

  let query = supabase
    .from('subscriptions')
    .select(`
      id, status, start_date, end_date, payment_method, created_at,
      subscriber:profiles!subscriptions_subscriber_id_fkey(full_name, avatar_url, country),
      trainer:profiles!subscriptions_trainer_id_fkey(full_name),
      plan:trainer_plans(name, name_ar, price, currency, duration_days)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: subs, count } = await query

  // Summary counts
  const { data: countsRaw } = await supabase
    .from('subscriptions')
    .select('status')

  const counts = (countsRaw as any[] | null) ?? []
  const summary = {
    active:   counts.filter((s: any) => s.status === 'active').length,
    expiring: counts.filter((s: any) => s.status === 'expiring').length,
    expired:  counts.filter((s: any) => s.status === 'expired').length,
    pending:  counts.filter((s: any) => s.status === 'pending').length,
    total:    counts.length,
  }

  return (
    <SubscriptionsClient
      subscriptions={subs ?? []}
      summary={summary}
      currentStatus={status}
      page={pageNum}
      pageSize={pageSize}
      total={count ?? 0}
    />
  )
}
