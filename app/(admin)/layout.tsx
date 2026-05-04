import { redirect }      from 'next/navigation'
import { createClient }  from '@/lib/supabase/server'
import { AdminSidebar }  from '@/components/admin/AdminSidebar'
import { AdminTopbar }   from '@/components/admin/AdminTopbar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).single()

  if ((profile as any)?.role !== 'admin') redirect('/')

  // Badge counts for sidebar
  const [{ count: pendingTrainers }, { count: pendingReports }] = await Promise.all([
    supabase.from('trainers').select('*', { count: 'exact', head: true })
      .eq('approval_status', 'pending'),
    supabase.from('reports').select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        pendingTrainers={pendingTrainers ?? 0}
        pendingReports={pendingReports ?? 0}
      />
      <main className="ms-[224px] min-h-screen flex flex-col">
        <AdminTopbar />
        <div className="p-6 flex-1">
          {children}
        </div>
      </main>
    </div>
  )
}
