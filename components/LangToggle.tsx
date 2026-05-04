'use client'

import { useRouter } from 'next/navigation'
import { setLanguage } from '@/lib/auth/actions'

export function LangToggle({ locale }: { locale: string }) {
  const router = useRouter()

  async function toggle() {
    const next = locale === 'ar' ? 'en' : 'ar'
    await setLanguage(next)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      className="text-xs font-bold font-mono px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5"
      style={{ color: '#C8F04B', border: '1px solid rgba(200,240,75,0.3)' }}
    >
      {locale === 'ar' ? 'EN' : 'ع'}
    </button>
  )
}
