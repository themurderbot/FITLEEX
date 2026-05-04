import { createClient }  from '@/lib/supabase/server'
import { redirect }      from 'next/navigation'
import { UsersClient }   from './UsersClient'

export const metadata = { title: 'Users' }

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profilesRaw } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const all = (profilesRaw as any[] | null) ?? []
  const subscriberCount = all.filter((p: any) => p.role === 'subscriber').length
  const trainerCount    = all.filter((p: any) => p.role === 'trainer').length
  const suspendedCount  = all.filter((p: any) => p.status === 'suspended').length

  return (
    <UsersClient
      profiles={all}
      currentUserId={user.id}
      subscriberCount={subscriberCount}
      trainerCount={trainerCount}
      suspendedCount={suspendedCount}
    />
  )
}
