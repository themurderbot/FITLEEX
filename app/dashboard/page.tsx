import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).single()

  if ((profile as any)?.role === 'admin')   redirect('/admin/overview')
  if ((profile as any)?.role === 'trainer') redirect('/trainer/dashboard')

  redirect('/subscriber/dashboard')
}
