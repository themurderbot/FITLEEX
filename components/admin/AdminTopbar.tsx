'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Bell, HelpCircle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function UserAvatar() {
  const [initials, setInitials] = useState('KA')
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.full_name as string | undefined
      if (name) {
        const parts = name.trim().split(/\s+/)
        setInitials(parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : name.slice(0, 2).toUpperCase())
      }
    })
  }, [])
  return (
    <div
      className="flex items-center justify-center font-bold text-xs text-black shrink-0"
      style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#C8F04B,#7ab82e)', borderRadius: 9 }}
    >
      {initials}
    </div>
  )
}

export function AdminTopbar() {
  const pathname = usePathname()
  const locale   = useLocale()
  const ta       = useTranslations('admin')
  const tt       = useTranslations('trainerNav')

  const [notifOpen, setNotifOpen] = useState(false)

  const titleMap: Record<string, string> = {
    '/admin/overview':      ta('overview'),
    '/admin/trainers':      ta('trainers'),
    '/admin/users':         ta('users'),
    '/admin/revenue':       ta('revenue'),
    '/admin/videos':        ta('videos'),
    '/admin/subscriptions': ta('subscriptions'),
    '/admin/reports':       ta('reports'),
    '/admin/settings':      ta('settings'),
    '/trainer/dashboard':   tt('navDashboard'),
    '/trainer/subscribers': tt('navSubscribers'),
    '/trainer/plan-builder':tt('navPlanBuilder'),
    '/trainer/progress':    tt('navProgress'),
    '/trainer/chat':        tt('navChat'),
    '/trainer/earnings':    tt('navEarnings'),
    '/trainer/promo-codes': tt('navPromoCodes'),
    '/trainer/settings':    tt('navSettings'),
  }

  const title = Object.entries(titleMap).find(([path]) => pathname.startsWith(path))?.[1] ?? 'FITLEEX'

  const today = new Date().toLocaleDateString(
    locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  )

  return (
    <div
      className="sticky top-0 z-50 flex items-center px-6 gap-3"
      style={{ height: 54, background: 'var(--surface, #111)', borderBottom: '1px solid #222' }}
    >
      <div className="flex-1">
        <div className="text-sm font-bold text-white">{title}</div>
        <div className="text-[11px] font-mono" style={{ color: '#555' }}>{today}</div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(o => !o)}
            className="relative flex items-center justify-center cursor-pointer transition-colors hover:bg-white/5"
            style={{ width: 32, height: 32, background: '#171717', border: '1px solid #222', borderRadius: 7 }}
          >
            <Bell size={14} className="text-muted" />
            <span
              className="absolute"
              style={{ top: 5, right: 5, width: 6, height: 6, background: '#FF4D4D', borderRadius: '50%', border: '1.5px solid #111' }}
            />
          </button>

          {notifOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              {/* Dropdown */}
              <div
                className="absolute end-0 top-10 z-50 rounded-xl overflow-hidden"
                style={{ width: 280, background: '#161616', border: '1px solid #222', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
              >
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #222' }}>
                  <span className="text-sm font-semibold text-white">
                    {locale === 'ar' ? 'الإشعارات' : 'Notifications'}
                  </span>
                  <button onClick={() => setNotifOpen(false)} className="text-muted hover:text-white">
                    <X size={14} />
                  </button>
                </div>
                <div className="p-6 text-center">
                  <Bell size={24} className="text-muted mx-auto mb-2" />
                  <p className="text-sm text-muted">{ta('noNotifications')}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Help */}
        <div
          className="flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors"
          style={{ width: 32, height: 32, background: '#171717', border: '1px solid #222', borderRadius: 7 }}
          title={locale === 'ar' ? 'المساعدة' : 'Help'}
        >
          <HelpCircle size={14} className="text-muted" />
        </div>

        {/* Avatar — initials from auth session */}
        <UserAvatar />
      </div>
    </div>
  )
}
