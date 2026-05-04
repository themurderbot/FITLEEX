import { createClient }    from '@/lib/supabase/server'
import { redirect }        from 'next/navigation'
import { PlatformSettingsClient } from './PlatformSettingsClient'

export const metadata = { title: 'Platform Settings' }

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: settings } = await supabase
    .from('platform_settings')
    .select('*')
    .order('key')

  return <PlatformSettingsClient settings={settings ?? []} adminId={user.id} />
}
