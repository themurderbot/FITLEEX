'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import {
  LayoutDashboard, Users, TrendingUp,
  MessageSquare, DollarSign, Tag, Settings, Camera,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { logout, setLanguage } from '@/lib/auth/actions'
import type { Profile, Trainer } from '@/types/database'

interface NavItem {
  href:     string
  labelKey: string
  icon:     React.ElementType
  badge?:   'chat' | 'progress'
}

const mainNav: NavItem[] = [
  { href: '/trainer/dashboard',   labelKey: 'navDashboard',   icon: LayoutDashboard },
  { href: '/trainer/subscribers', labelKey: 'navSubscribers', icon: Users },
  { href: '/trainer/progress',    labelKey: 'navProgress',    icon: TrendingUp,    badge: 'progress' },
  { href: '/trainer/chat',        labelKey: 'navChat',        icon: MessageSquare, badge: 'chat' },
]

const businessNav: NavItem[] = [
  { href: '/trainer/earnings',        labelKey: 'navEarnings',        icon: DollarSign },
  { href: '/trainer/promo-codes',     labelKey: 'navPromoCodes',      icon: Tag },
  { href: '/trainer/transformations', labelKey: 'navTransformations', icon: Camera },
  { href: '/trainer/settings',        labelKey: 'navSettings',        icon: Settings },
]

interface SidebarProps {
  profile:        Profile
  trainer:        Trainer
  unreadMessages: number
  pendingReviews: number
}

export function Sidebar({ profile, trainer, unreadMessages, pendingReviews }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const locale   = useLocale() as 'ar' | 'en'
  const t        = useTranslations('trainerNav')
  const tn       = useTranslations('nav')

  const badges: Record<string, number> = {
    chat:     unreadMessages,
    progress: pendingReviews,
  }

  async function handleLang(l: 'ar' | 'en') {
    await setLanguage(l)
    router.refresh()
  }

  const initials = getInitials(profile.full_name)

  const renderNavGroup = (label: string, items: NavItem[]) => (
    <div className="mb-1">
      <div
        className="px-3 mb-1 text-[10px] font-bold tracking-[3px] uppercase"
        style={{ color: '#444', fontFamily: 'var(--font-mono, monospace)' }}
      >
        {label}
      </div>
      {items.map(item => {
        const Icon   = item.icon
        const active = pathname.startsWith(item.href)
        const badge  = item.badge ? badges[item.badge] ?? 0 : 0

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 relative mb-0.5',
              active ? 'font-semibold' : 'hover:bg-white/[0.04]'
            )}
            style={active
              ? { background: 'rgba(200,240,75,0.07)', color: '#C8F04B' }
              : { color: '#777' }}
          >
            {active && (
              <span
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: 0, width: 3, height: '60%', background: '#C8F04B', borderRadius: '0 3px 3px 0' }}
              />
            )}
            <Icon size={16} />
            <span className="flex-1">{t(item.labelKey as any)}</span>
            {badge > 0 && (
              <span
                className="flex items-center justify-center font-bold font-mono text-[10px] px-1.5 rounded-full"
                style={{ minWidth: 18, height: 18, background: '#C8F04B', color: '#000' }}
              >
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )

  return (
    <aside
      className="fixed inset-y-0 z-40 flex flex-col"
      style={{
        left: 0,          /* always left — never flips with RTL */
        width: 224,
        background: '#111',
        borderRight: '1px solid #222',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-5 shrink-0"
        style={{ height: 56, borderBottom: '1px solid #222' }}
      >
        <div
          className="flex items-center justify-center shrink-0 font-black text-xs text-black"
          style={{ width: 32, height: 32, background: '#C8F04B', borderRadius: 8 }}
        >
          FF
        </div>
        <div className="font-black text-lg tracking-widest">
          FIT<span style={{ color: '#C8F04B' }}>FEEZ</span>
        </div>
      </div>

      {/* Trainer profile */}
      <div className="px-4 py-3.5 shrink-0" style={{ borderBottom: '1px solid #222' }}>
        <div
          className="flex items-center justify-center font-extrabold text-sm text-black mb-2.5 overflow-hidden"
          style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#C8F04B,#7ab82e)', flexShrink: 0 }}
        >
          {profile.avatar_url
            ? <Image src={profile.avatar_url} alt={profile.full_name} width={40} height={40} className="object-cover" />
            : initials}
        </div>
        <p className="text-sm font-bold text-white leading-tight">{profile.full_name}</p>
        <p className="text-[11px] mt-0.5" style={{ color: '#555' }}>
          @{profile.full_name.toLowerCase().replace(/\s+/g, '')}
        </p>
        <span
          className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-mono px-2.5 py-0.5 rounded-full"
          style={{ background: 'rgba(200,240,75,0.08)', border: '1px solid rgba(200,240,75,0.15)', color: '#C8F04B' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#C8F04B]" />
          {locale === 'ar' ? 'مدرب معتمد' : 'Verified Trainer'}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 pt-3">
        {renderNavGroup(locale === 'ar' ? 'الرئيسية' : 'Main',     mainNav)}
        {renderNavGroup(locale === 'ar' ? 'الأعمال'  : 'Business', businessNav)}
      </nav>

      {/* Bottom: lang toggle + logout */}
      <div className="p-2 shrink-0" style={{ borderTop: '1px solid #222' }}>
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
                : { background: 'transparent', color: '#666' }}
            >
              {l === 'en' ? 'EN' : 'ع'}
            </button>
          ))}
        </div>

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
