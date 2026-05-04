import { createClient }  from '@/lib/supabase/server'
import { redirect }      from 'next/navigation'
import { ReportsClient } from './ReportsClient'

export const metadata = { title: 'Reports' }

interface PageProps { searchParams: Promise<{ status?: string }> }

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const { status = 'pending' } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  let query = supabase
    .from('reports')
    .select(`
      *,
      reporter:profiles!reporter_id(full_name, role),
      reported:profiles!reported_id(full_name, role)
    `)
    .order('created_at', { ascending: false })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: reports } = await query

  return <ReportsClient reports={reports ?? []} defaultStatus={status} />
}
