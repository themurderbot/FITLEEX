'use client'

import { useTransition } from 'react'
import { useLocale } from 'next-intl'

export function LanguageToggle() {
  const locale = useLocale()
  const [, startTransition] = useTransition()

  function toggle() {
    const next = locale === 'ar' ? 'en' : 'ar'
    startTransition(() => {
      document.cookie = `FITLEEX_LANG=${next};path=/;max-age=31536000`
      window.location.reload()
    })
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10
                 text-sm text-muted hover:text-white hover:border-white/20 transition-colors"
    >
      <span className="text-base">{locale === 'ar' ? '🇬🇧' : '🇸🇦'}</span>
      <span>{locale === 'ar' ? 'EN' : 'عربي'}</span>
    </button>
  )
}
