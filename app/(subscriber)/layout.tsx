import { createClient }    from '@/lib/supabase/server'
import { redirect }        from 'next/navigation'
import Link                from 'next/link'
import { logout }          from '@/lib/auth/actions'
import { getLocale }       from 'next-intl/server'
import { NavBar }      from './NavBar'
import { LangToggle }  from '@/components/LangToggle'

export default async function SubscriberLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await (supabase as any)
    .from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')
  if ((profile as any).role !== 'subscriber') {
    const r = (profile as any).role
    redirect(r === 'trainer' ? '/trainer/dashboard' : r === 'admin' ? '/admin/overview' : '/auth/login')
  }

  const locale = await getLocale()

  // Get only this subscriber's conversations, then count unread messages in them
  const { data: myConvos } = await (supabase as any)
    .from('conversations')
    .select('id')
    .eq('subscriber_id', user.id)

  const convoIds = (myConvos ?? []).map((c: any) => c.id)

  const { count: unread } = convoIds.length > 0
    ? await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', convoIds)
        .eq('read', false)
        .neq('sender_id', user.id)
    : { count: 0 }

  const navItems = [
    { href: '/subscriber/dashboard', iconName: 'Home',          labelEn: 'Home',     labelAr: 'الرئيسية' },
    { href: '/subscriber/trainers',  iconName: 'Users',         labelEn: 'Trainers', labelAr: 'المدربون' },
    { href: '/subscriber/chat',      iconName: 'MessageCircle', labelEn: 'Chat',     labelAr: 'المحادثة', badge: unread ?? 0 },
    { href: '/subscriber/plan',      iconName: 'ClipboardList', labelEn: 'Plans',    labelAr: 'الخطط' },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Top bar */}
      <header className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-5"
        style={{ height: 52, background: 'rgba(10,10,10,0.95)', borderBottom: '1px solid #1a1a1a', backdropFilter: 'blur(12px)' }}>
        <span className="font-black text-lg tracking-tight" style={{ color: '#C8F04B', fontFamily: 'var(--font-display, sans-serif)' }}>
          FITLEEX
        </span>
        <div className="flex items-center gap-2">
          <LangToggle locale={locale} />
          <form action={logout}>
            <button type="submit" className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: '#555', border: '1px solid #222' }}>
              {locale === 'ar' ? 'خروج' : 'Logout'}
            </button>
          </form>
        </div>
      </header>

      {/* Content */}
      <main className="pt-[52px] pb-[68px] min-h-screen">
        <div className="max-w-lg mx-auto px-4 py-5">
          {children}
        </div>
      </main>

      <NavBar items={navItems} locale={locale} />
    </div>
  )
}
