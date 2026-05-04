'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AuthCard }  from '@/components/shared/AuthCard'
import { FormError } from '@/components/shared/FormError'
import { login }     from '@/lib/auth/actions'
import type { ActionResult } from '@/lib/auth/actions'

export default function LoginPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [showPw,  setShowPw]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await login(fd)
      if (!result.success) setError((result as { success: false; error: string }).error)
      else router.push((result as { success: true; dest?: string }).dest ?? '/')
    })
  }

  return (
    <AuthCard title={t('loginTitle')} subtitle={t('loginSubtitle')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
        <FormError message={error} />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted">{t('emailLabel')}</label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="input"
            dir="ltr"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted">{t('passwordLabel')}</label>
            <Link href="/auth/forgot-password" className="text-xs text-brand hover:underline">
              {t('forgotPassword')}
            </Link>
          </div>
          <div className="relative">
            <input
              name="password"
              type={showPw ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••"
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

        <button
          type="submit"
          disabled={pending}
          className="btn-brand flex items-center justify-center gap-2 py-3 mt-2"
        >
          {pending ? (
            <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <LogIn size={16} />
          )}
          {pending ? t('signingIn') : t('loginBtn')}
        </button>

        <p className="text-center text-sm text-muted">
          {t('noAccount')}{' '}
          <Link href="/auth/signup" className="text-brand hover:underline">
            {t('createAccountLink')}
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}
