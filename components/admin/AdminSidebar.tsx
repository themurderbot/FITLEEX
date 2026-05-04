'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { cn } from '@/lib/utils'
import { logout, setLanguage } from '@/lib/auth/actions'

const navSections = [
  {
    labelKey: 'overview',
    items: [
      { href: '/admin/overview',      key: 'overview' },
      { href: '/admin/trainers',      key: 'trainers',      badge: 'trainers' },
      { href: '/admin/users',         key: 'users' },
      { href: '/admin/videos',        key: 'videos' },
    ],
  },
  {
    labelKey: 'finance',
    items: [
      { href: '/admin/revenue',       key: 'revenue' },
      { href: '/admin/subscriptions', key: 'subscriptions' },
    ],
  },
  {
    labelKey: 'trust',
    items: [
      { href: '/admin/reports',       key: 'reports',       badge: 'reports' },
      { href: '/admin/settings',      key: 'settings' },
    ],
  },
]

interface AdminSidebarProps {
  pendingTrainers: number
  pendingReports:  number
}

export function AdminSidebar({ pendingTrainers, pendingReports }: AdminSidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const locale   = useLocale() as 'ar' | 'en'
  const t        = useTranslations('admin')
  const tn       = useTranslations('nav')

  const sectionLabels: Record<string, string> = {
    overview: locale === 'ar' ? 'نظرة عامة' : 'Overview',
    finance:  locale === 'ar' ? 'المالية'   : 'Finance',
    trust:    locale === 'ar' ? 'الثقة والسلامة' : 'Trust & Safety',
  }

  const badges: Record<string, number> = {
    trainers: pendingTrainers,
    reports:  pendingReports,
  }

  async function handleLang(l: 'ar' | 'en') {
    await setLanguage(l)
    router.refresh()
  }

  return (
    <aside
      className="fixed inset-y-0 start-0 z-40 flex flex-col"
      style={{ width: 224, background: 'var(--surface, #111)', borderInlineEnd: '1px solid #222' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4" style={{ borderBottom: '1px solid #222' }}>
        <div
          className="flex items-center justify-center shrink-0 font-black text-xs text-black"
          style={{ width: 30, height: 30, background: '#C8F04B', borderRadius: 7 }}
        >
          FF
        </div>
        <div className="font-black text-lg tracking-widest">
          FIT<span style={{ color: '#C8F04B' }}>FEEZ</span>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-4 py-2.5" style={{ borderBottom: '1px solid #222' }}>
        <span
          className="inline-flex items-center gap-1.5 text-xs font-bold font-mono px-3 py-1 rounded-full"
          style={{ background: 'rgba(255,77,77,0.10)', border: '1px solid rgba(255,77,77,0.20)', color: '#FF4D4D' }}
        >
          🛡 {t('superAdmin')}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2">
        {navSections.map(section => (
          <div key={section.labelKey} className="mb-1">
            <div
              className="px-2.5 py-1.5 text-xs font-mono tracking-widest uppercase"
              style={{ color: '#444', letterSpacing: '0.2em' }}
            >
              {sectionLabels[section.labelKey]}
            </div>
            {section.items.map(item => {
              const active = pathname.startsWith(item.href)
              const badge  = item.badge ? badges[item.badge] ?? 0 : 0
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 relative',
                    active ? 'font-semibold' : 'hover:bg-white/[0.04]'
                  )}
                  style={active
                    ? { background: 'rgba(200,240,75,0.07)', color: '#C8F04B' }
                    : { color: '#888' }}
                >
                  {active && (
                    <span
                      className="absolute inset-y-0 start-0 my-auto rounded-e"
                      style={{ width: 3, height: '60%', background: '#C8F04B', borderRadius: '0 3px 3px 0' }}
                    />
                  )}
                  <span className="flex-1 ps-1">{t(item.key as any)}</span>
                  {badge > 0 && (
                    <span
                      className="flex items-center justify-center font-bold font-mono text-[10px] px-1.5 rounded-full"
                      style={{ minWidth: 18, height: 18, background: '#FF4D4D', color: '#fff' }}
                    >
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom: lang toggle + logout */}
      <div className="p-2" style={{ borderTop: '1px solid #222' }}>
        {/* Language toggle */}
        <div
          className="flex overflow-hidden mb-2 rounded-lg"
          style={{ background: '#171717', border: '1px solid #222' }}
        >
          {(['en', 'ar'] as const).map(l => (
            <button
              key={l}
              onClick={() => handleLang(l)}
              className="flex-1 py-1.5 text-xs font-bold font-mono transition-all duration-150"
              style={locale === l
                ? { background: '#C8F04B', color: '#000' }
                : { background: 'transparent', color: '#888' }
              }
            >
              {l === 'en' ? 'EN' : 'ع'}
            </button>
          ))}
        </div>

        {/* Logout */}
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150"
            style={{
              background: 'rgba(255,77,77,0.10)',
              border: '1px solid rgba(255,77,77,0.20)',
              color: '#FF4D4D',
            }}
          >
            <span>🚪</span>
            <span>{tn('logout')}</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
