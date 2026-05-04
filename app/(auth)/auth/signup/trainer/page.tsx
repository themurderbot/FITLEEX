'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Upload, CheckCircle2, ChevronLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AuthCard }                         from '@/components/shared/AuthCard'
import { FormError }                        from '@/components/shared/FormError'
import { signupTrainer, uploadTrainerDocument } from '@/lib/auth/actions'
import type { ActionResult }                from '@/lib/auth/actions'
import { cn }                               from '@/lib/utils'

type Step1Data = {
  full_name: string; email: string; password: string
  country: string; language: 'ar' | 'en'
}
type Step2Data = {
  specialty: string; bio: string; years_experience: string
}

export default function TrainerSignupPage() {
  const t = useTranslations('auth')
  const [step,    setStep]    = useState(0)
  const [error,   setError]   = useState<string | null>(null)
  const [showPw,  setShowPw]  = useState(false)
  const [pending, startTransition] = useTransition()

  const [step1, setStep1] = useState<Step1Data | null>(null)
  const [step2, setStep2] = useState<Step2Data | null>(null)

  const [idUploaded,   setIdUploaded]   = useState(false)
  const [certUploaded, setCertUploaded] = useState(false)
  const idRef   = useRef<HTMLInputElement>(null)
  const certRef = useRef<HTMLInputElement>(null)

  const STEPS = [t('step1Label'), t('step2Label'), t('step3Label')]

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

  const specialties = [
    t('specFatLoss'), t('specMuscle'), t('specWomen'), t('specStrength'),
    t('specCardio'), t('specRehab'), t('specNutrition'), t('specYoga'),
    t('specMartial'), t('specFootball'),
  ]

  function handleStep1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    setStep1({
      full_name:  fd.get('full_name') as string,
      email:      fd.get('email') as string,
      password:   fd.get('password') as string,
      country:    fd.get('country') as string,
      language:   fd.get('language') as 'ar' | 'en',
    })
    setStep(1)
  }

  function handleStep2(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const s2: Step2Data = {
      specialty:        fd.get('specialty') as string,
      bio:              fd.get('bio') as string,
      years_experience: fd.get('years_experience') as string,
    }
    setStep2(s2)

    const fullFd = new FormData()
    Object.entries(step1!).forEach(([k, v]) => fullFd.append(k, v))
    Object.entries(s2).forEach(([k, v]) => fullFd.append(k, v))

    startTransition(async () => {
      const result = await signupTrainer(fullFd)
      if (!result.success) {
        setError((result as { success: false; error: string }).error)
      } else {
        setStep(2)
      }
    })
  }

  async function handleUpload(type: 'id' | 'cert', ref: React.RefObject<HTMLInputElement>) {
    const file = ref.current?.files?.[0]
    if (!file) return
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', type)
    startTransition(async () => {
      const result = await uploadTrainerDocument(fd)
      if (!result.success) {
        setError((result as any).error)
      } else {
        if (type === 'id')   setIdUploaded(true)
        if (type === 'cert') setCertUploaded(true)
      }
    })
  }

  return (
    <AuthCard
      title={t('trainerSignupTitle')}
      subtitle={t('trainerSignupSubtitle')}
      className="max-w-lg"
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mt-4 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
              i < step  ? 'bg-brand text-black' :
              i === step ? 'bg-brand/20 border-2 border-brand text-brand' :
                           'bg-white/5 text-muted border border-white/10'
            )}>
              {i < step ? <CheckCircle2 size={14} /> : i + 1}
            </div>
            <span className={cn(
              'text-xs hidden sm:block transition-colors',
              i === step ? 'text-white' : 'text-muted'
            )}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn('flex-1 h-px', i < step ? 'bg-brand/40' : 'bg-white/10')} />
            )}
          </div>
        ))}
      </div>

      <FormError message={error} />

      {/* Step 0: Account Info */}
      {step === 0 && (
        <form onSubmit={handleStep1} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted">{t('fullNameLabel')}</label>
            <input name="full_name" type="text" required className="input" placeholder={t('fullNamePlaceholder')} defaultValue={step1?.full_name} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted">{t('emailLabel')}</label>
            <input name="email" type="email" required className="input" dir="ltr" placeholder="trainer@example.com" defaultValue={step1?.email} />
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
                defaultValue={step1?.password}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute inset-y-0 end-3 flex items-center text-muted hover:text-white" tabIndex={-1}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm text-muted">{t('countryLabel')}</label>
              <select name="country" required className="input" defaultValue={step1?.country ?? 'SA'}>
                {countries.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm text-muted">{t('languageLabel')}</label>
              <select name="language" required className="input" defaultValue={step1?.language ?? 'ar'}>
                <option value="ar">{t('langArabic')}</option>
                <option value="en">{t('langEnglish')}</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-brand flex items-center justify-center gap-2 py-3 mt-2">
            {t('nextBtn')} <ChevronLeft size={16} />
          </button>

          <p className="text-center text-sm text-muted">
            {t('hasAccountShort')}{' '}
            <Link href="/auth/login" className="text-brand hover:underline">{t('signInLink')}</Link>
          </p>
        </form>
      )}

      {/* Step 1: Professional Info */}
      {step === 1 && (
        <form onSubmit={handleStep2} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted">{t('specialtyLabel')}</label>
            <select name="specialty" required className="input" defaultValue={step2?.specialty}>
              <option value="">{t('chooseSpecialty')}</option>
              {specialties.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted">{t('yearsExpLabel')}</label>
            <input
              name="years_experience"
              type="number"
              min="0"
              max="50"
              required
              className="input"
              placeholder="3"
              defaultValue={step2?.years_experience}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted">{t('bioLabel')}</label>
            <textarea
              name="bio"
              required
              minLength={20}
              rows={4}
              className="input resize-none"
              placeholder={t('bioPlaceholder')}
              defaultValue={step2?.bio}
            />
            <p className="text-xs text-muted">{t('bioMinChars')}</p>
          </div>

          <div className="flex gap-2 mt-2">
            <button type="button" onClick={() => setStep(0)} className="btn-outline flex-1 py-3">
              {t('backBtn')}
            </button>
            <button type="submit" disabled={pending}
              className="btn-brand flex-1 flex items-center justify-center gap-2 py-3">
              {pending
                ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                : <ChevronLeft size={16} />}
              {pending ? t('creating') : t('nextBtn')}
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Documents */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">{t('docsDesc')}</p>

          <UploadRow
            label={t('nationalIdLabel')}
            accept="image/*,.pdf"
            done={idUploaded}
            pending={pending}
            inputRef={idRef}
            uploadedBadge={t('uploadedBadge')}
            uploadBtn={t('uploadBtn')}
            onUpload={() => handleUpload('id', idRef)}
          />

          <UploadRow
            label={t('certLabel')}
            accept="image/*,.pdf"
            done={certUploaded}
            pending={pending}
            inputRef={certRef}
            uploadedBadge={t('uploadedBadge')}
            uploadBtn={t('uploadBtn')}
            onUpload={() => handleUpload('cert', certRef)}
          />

          <Link href="/auth/pending" className="btn-brand text-center py-3 mt-2">
            {idUploaded || certUploaded ? t('finishBtn') : t('skipBtn')}
          </Link>

          <p className="text-xs text-muted text-center">{t('reviewNotice')}</p>
        </div>
      )}
    </AuthCard>
  )
}

function UploadRow({
  label, accept, done, pending, inputRef, uploadedBadge, uploadBtn, onUpload,
}: {
  label:        string
  accept:       string
  done:         boolean
  pending:      boolean
  inputRef:     React.RefObject<HTMLInputElement>
  uploadedBadge: string
  uploadBtn:    string
  onUpload:     () => void
}) {
  return (
    <div className={cn(
      'flex items-center justify-between p-4 rounded-xl border transition-colors',
      done ? 'border-success/30 bg-success/5' : 'border-white/[0.06] bg-white/[0.02]'
    )}>
      <div className="flex items-center gap-3">
        {done
          ? <CheckCircle2 size={18} className="text-success" />
          : <Upload size={18} className="text-muted" />
        }
        <span className={cn('text-sm', done ? 'text-white' : 'text-muted')}>{label}</span>
        {done && <span className="badge badge-success">{uploadedBadge}</span>}
      </div>

      {!done && (
        <>
          <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onUpload} />
          <button
            type="button"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
            className="btn-outline text-xs py-1.5 px-3"
          >
            {pending ? '...' : uploadBtn}
          </button>
        </>
      )}
    </div>
  )
}
