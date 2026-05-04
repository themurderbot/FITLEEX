'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AuthCard }          from '@/components/shared/AuthCard'
import { FormError }         from '@/components/shared/FormError'
import { signupSubscriber }  from '@/lib/auth/actions'
import type { ActionResult } from '@/lib/auth/actions'

export default function SubscriberSignupPage() {
  const t = useTranslations('auth')
  const [showPw,  setShowPw]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const countries = [
    { code: 'SA', label: t('cSA') },
    { code: 'AE', label: t('cAE') },
    { code: 'KW', label: t('cKW') },
    { code: 'BH', label: t('cBH') },
    { code: 'QA', label: t('cQA') },
    { code: 'OM', label: t('cOM') },
    { code: 'EG', label: t('cEG') },
    { code: 'JO', label: t('cJO') },
  ]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await signupSubscriber(fd)
      if (!result.success) setError((result as { success: false; error: string }).error)
    })
  }

  return (
    <AuthCard title={t('subSignupTitle')} subtitle={t('subSignupSubtitle')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
        <FormError message={error} />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted">{t('fullNameLabel')}</label>
          <input name="full_name" type="text" required className="input" placeholder={t('fullNamePlaceholder')} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted">{t('emailLabel')}</label>
          <input name="email" type="email" required className="input" placeholder="you@example.com" dir="ltr" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted">{t('passwordLabel')}</label>
          <div className="relative">
            <input
              name="password"
              type={showPw ? 'text' : 'password'}
              required
              minLength={8}
              placeholder={t('passwordPlaceholder')}
              className="input pe-10"
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute inset-y-0 end-3 flex items-center text-muted hover:text-white"
              tabIndex={-1}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted">{t('countryLabel')}</label>
          <select name="country" required className="input">
            {countries.map(c => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted">{t('languageLabel')}</label>
          <div className="flex gap-2">
            {[{ val: 'ar', label: t('langArabic') }, { val: 'en', label: t('langEnglish') }].map(l => (
              <label key={l.val} className="flex-1 flex items-center justify-center gap-2
                                            border border-white/10 rounded-lg py-2.5 text-sm
                                            cursor-pointer hover:border-brand/40 has-[:checked]:border-brand
                                            has-[:checked]:bg-brand/5 transition-colors">
                <input type="radio" name="language" value={l.val} defaultChecked={l.val === 'ar'} className="sr-only" />
                {l.label}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="btn-brand flex items-center justify-center gap-2 py-3 mt-2"
        >
          {pending ? (
            <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <UserPlus size={16} />
          )}
          {pending ? t('creating') : t('createAccountBtn')}
        </button>

        <p className="text-center text-sm text-muted">
          {t('hasAccountShort')}{' '}
          <Link href="/auth/login" className="text-brand hover:underline">{t('signInLink')}</Link>
        </p>
      </form>
    </AuthCard>
  )
}
