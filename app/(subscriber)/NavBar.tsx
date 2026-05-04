'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, MessageCircle, ClipboardList, LucideIcon } from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  Home, Users, MessageCircle, ClipboardList,
}

interface NavItem {
  href:     string
  iconName: string
  labelEn:  string
  labelAr:  string
  badge?:   number
}

interface Props {
  items:  NavItem[]
  locale: string
}

export function NavBar({ items, locale }: Props) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40"
      style={{ background: 'rgba(12,12,12,0.98)', borderTop: '1px solid #1e1e1e', backdropFilter: 'blur(12px)', height: 68 }}>
      <div className="max-w-lg mx-auto h-full flex items-center justify-around px-2">
        {items.map(item => {
          const active  = pathname.startsWith(item.href)
          const Icon    = ICONS[item.iconName]
          return (
            <Link key={item.href} href={item.href}
              className="relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors"
              style={{ color: active ? '#C8F04B' : '#555' }}>
              <div className="relative">
                {Icon && <Icon size={22} />}
                {(item.badge ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
                    style={{ background: '#C8F04B', color: '#000' }}>
                    {(item.badge ?? 0) > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold">
                {locale === 'ar' ? item.labelAr : item.labelEn}
              </span>
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: '#C8F04B' }} />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
