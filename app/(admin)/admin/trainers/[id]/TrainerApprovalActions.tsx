'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

interface Props {
  trainerId: string
  currentStatus: 'pending' | 'approved' | 'rejected'
  rejectionReason: string | null
}

export function TrainerApprovalActions({ trainerId, currentStatus, rejectionReason }: Props) {
  const t = useTranslations('admin')
  const router = useRouter()
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [reason, setReason] = useState(rejectionReason ?? '')
  const [pending, startTransition] = useTransition()
  const supabase = createClient()

  function handleApprove() {
    startTransition(async () => {
      await (supabase as any).rpc('admin_review_trainer', {
        p_trainer_id: trainerId,
        p_decision: 'approved',
      } as any)
      router.refresh()
    })
  }

  function handleReject() {
    startTransition(async () => {
      await (supabase as any).rpc('admin_review_trainer', {
        p_trainer_id: trainerId,
        p_decision: 'rejected',
        p_rejection_reason: reason,
      } as any)
      setShowRejectForm(false)
      router.refresh()
    })
  }

  if (currentStatus === 'approved') {
    return (
      <div className="card p-4 flex flex-col gap-3">
        <p className="text-xs text-muted uppercase font-bold tracking-wider">{t('colStatus')}</p>
        <span className="badge badge-success w-fit">{t('approved')}</span>
        <button
          onClick={() => startTransition(async () => {
            await (supabase as any).rpc('admin_review_trainer', { p_trainer_id: trainerId, p_decision: 'rejected' } as any)
            router.refresh()
          })}
          disabled={pending}
          className="text-xs px-3 py-2 rounded-lg w-full transition-colors"
          style={{ background: 'rgba(255,77,77,0.12)', color: '#FF4D4D', border: '1px solid rgba(255,77,77,0.25)' }}
        >
          {t('suspendBtn')}
        </button>
      </div>
    )
  }

  if (currentStatus === 'rejected') {
    return (
      <div className="card p-4 flex flex-col gap-3">
        <p className="text-xs text-muted uppercase font-bold tracking-wider">{t('colStatus')}</p>
        <span className="badge badge-danger w-fit">{t('rejected')}</span>
        {rejectionReason && (
          <p className="text-xs text-muted italic">"{rejectionReason}"</p>
        )}
        <button
          onClick={handleApprove}
          disabled={pending}
          className="text-xs px-3 py-2 rounded-lg w-full font-semibold transition-colors"
          style={{ background: 'rgba(76,175,80,0.15)', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.3)' }}
        >
          {t('reactivate')}
        </button>
      </div>
    )
  }

  return (
    <div className="card p-4 flex flex-col gap-3">
      <p className="text-xs text-muted uppercase font-bold tracking-wider">{t('colStatus')}</p>
      <span className="badge badge-warning w-fit">{t('tabPending')}</span>

      <button
        onClick={handleApprove}
        disabled={pending}
        className="text-sm px-3 py-2 rounded-lg w-full font-semibold transition-colors"
        style={{ background: 'rgba(76,175,80,0.15)', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.3)' }}
      >
        {t('approveTrainerBtn')}
      </button>

      {!showRejectForm ? (
        <button
          onClick={() => setShowRejectForm(true)}
          className="text-sm px-3 py-2 rounded-lg w-full transition-colors"
          style={{ background: 'rgba(255,77,77,0.1)', color: '#FF4D4D', border: '1px solid rgba(255,77,77,0.2)' }}
        >
          {t('rejectTrainerBtn')}
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="text-xs text-muted">{t('rejectionReasonLabel')}</label>
          <textarea
            className="input text-xs"
            rows={3}
            placeholder={t('rejectionReasonPlaceholder')}
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={pending || !reason.trim()}
              className="flex-1 text-xs py-2 rounded-lg font-medium disabled:opacity-40"
              style={{ background: 'rgba(255,77,77,0.12)', color: '#FF4D4D', border: '1px solid rgba(255,77,77,0.25)' }}
            >
              {t('confirmRejectBtn')}
            </button>
            <button
              onClick={() => setShowRejectForm(false)}
              className="flex-1 text-xs py-2 rounded-lg border border-white/10 text-muted hover:text-white"
            >
              {t('dismissBtn')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
