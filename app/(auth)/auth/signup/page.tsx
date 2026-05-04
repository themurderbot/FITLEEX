import Link from 'next/link'
import { Dumbbell, Users } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { AuthCard } from '@/components/shared/AuthCard'

export default async function SignupRolePage() {
  const t = await getTranslations('auth')

  const roles = [
    {
      href:     '/auth/signup/subscriber',
      icon:     Users,
      title:    t('roleSubscriber'),
      subtitle: t('roleSubscriberDesc'),
    },
    {
      href:     '/auth/signup/trainer',
      icon:     Dumbbell,
      title:    t('roleTrainer'),
      subtitle: t('roleTrainerDesc'),
    },
  ]

  return (
    <AuthCard
      title={t('signupTitle')}
      subtitle={t('signupSubtitle')}
      className="max-w-lg"
    >
      <div className="flex flex-col gap-3 mt-6">
        {roles.map(role => {
          const Icon = role.icon
          return (
            <Link
              key={role.href}
              href={role.href}
              className="flex items-center gap-4 p-5 rounded-xl border border-white/[0.06]
                         hover:border-brand/40 hover:bg-brand/5 transition-all duration-150 group"
            >
              <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center shrink-0
                              group-hover:bg-brand/15 transition-colors">
                <Icon size={22} className="text-brand" />
              </div>
              <div>
                <p className="font-semibold text-white">{role.title}</p>
                <p className="text-sm text-muted mt-0.5">{role.subtitle}</p>
              </div>
              <div className="ms-auto text-muted group-hover:text-brand transition-colors text-lg">←</div>
            </Link>
          )
        })}

        <p className="text-center text-sm text-muted pt-2">
          {t('hasAccount')}{' '}
          <Link href="/auth/login" className="text-brand hover:underline">
            {t('signInLink')}
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}
