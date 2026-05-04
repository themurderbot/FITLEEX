'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Send, CheckCircle2, Clock, FileEdit, X } from 'lucide-react'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

interface Submission {
  id: string
  subscription_id: string
  subscriber_id: string
  week_number: number
  weight_kg?: number | null
  photos?: string[]
  notes?: string | null
  reviewed: boolean
  submitted_at: string
  profiles?: { full_name: string; avatar_url?: string }
  trainer_feedback?: { message: string; created_at: string }[]
}

const AV_COLORS = [
  'linear-gradient(135deg,#C8F04B,#7ab82e)',
  'linear-gradient(135deg,#60a5fa,#3b82f6)',
  'linear-gradient(135deg,#FF5A36,#cc3d20)',
  'linear-gradient(135deg,#a78bfa,#7c3aed)',
]

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return '1d ago'
  return `${days}d ago`
}

export function ProgressReviewClient({ submissions: initial, trainerId }: { submissions: Submission[]; trainerId: string }) {
  const locale   = useLocale()
  const supabase = createClient()
  const [submissions, setSubmissions] = useState(initial)
  const [selected, setSelected]       = useState<Submission | null>(initial.find(s => !s.reviewed) ?? initial[0] ?? null)
  const [feedback, setFeedback]       = useState('')
  const [pending, startTransition]    = useTransition()
  const [feedbackErr, setFeedbackErr] = useState<string | null>(null)
  const [lightbox, setLightbox]       = useState<string | null>(null)

  const lbl = (en: string, ar: string) => locale === 'ar' ? ar : en

  const pending_ = submissions.filter(s => !s.reviewed)
  const reviewed = submissions.filter(s => s.reviewed)

  function handleFeedback() {
    if (!selected || !feedback.trim()) return
    setFeedbackErr(null)
    startTransition(async () => {
      const { error: fbErr } = await (supabase.from('trainer_feedback') as any).insert({
        submission_id: selected.id,
        trainer_id:    trainerId,
        message:       feedback,
      })
      if (fbErr) {
        setFeedbackErr(lbl('Failed to send feedback. Please try again.', 'فشل إرسال الرد. حاول مجدداً.'))
        return
      }
      await (supabase.from('progress_submissions') as any).update({ reviewed: true }).eq('id', selected.id)
      setSubmissions(s => s.map(x => x.id === selected.id ? { ...x, reviewed: true } : x))
      setSelected(s => s ? { ...s, reviewed: true } : s)
      setFeedback('')
    })
  }

  function SubmissionCard({ s, idx }: { s: Submission; idx: number }) {
    const prof    = (s.profiles as any) ?? {}
    const name    = prof.full_name ?? '—'
    const isActive = selected?.id === s.id
    return (
      <button
        onClick={() => setSelected(s)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-start transition-colors"
        style={{
          borderBottom: '1px solid #1e1e1e',
          background:   isActive ? 'rgba(200,240,75,0.05)' : 'transparent',
          borderLeft:   isActive ? '3px solid #C8F04B' : '3px solid transparent',
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: AV_COLORS[idx % AV_COLORS.length],
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 12, color: '#000',
        }}>
          {initials(name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p className="text-sm font-semibold text-white truncate">{name}</p>
            {s.reviewed
              ? <CheckCircle2 size={14} style={{ color: '#4CAF50', flexShrink: 0 }} />
              : <Clock size={13} style={{ color: '#FF8C42', flexShrink: 0 }} />}
          </div>
          <p className="text-[11px] mt-0.5 font-mono" style={{ color: '#555' }}>
            {lbl(`Week ${s.week_number}`, `الأسبوع ${s.week_number}`)}
            {s.weight_kg ? ` · ${s.weight_kg} kg` : ''}
            {` · ${timeAgo(s.submitted_at)}`}
          </p>
        </div>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-extrabold text-white">
          {lbl('Progress Review', 'مراجعة التقدم')}
        </h1>
        <p className="text-[11px] font-mono mt-0.5" style={{ color: '#555' }}>
          {pending_.length} {lbl('pending review', 'بانتظار المراجعة')}
        </p>
      </div>

      <div className="flex gap-4" style={{ minHeight: 600 }}>
        {/* Left panel — submission list */}
        <div className="shrink-0 flex flex-col rounded-xl overflow-hidden"
          style={{ width: 270, border: '1px solid #222', background: '#111' }}>
          {/* Pending */}
          {pending_.length > 0 && (
            <>
              <div className="px-4 py-2.5 shrink-0" style={{ borderBottom: '1px solid #222' }}>
                <span className="text-[10px] font-mono tracking-[2px] uppercase" style={{ color: '#FF8C42' }}>
                  {lbl(`Pending (${pending_.length})`, `بانتظار المراجعة (${pending_.length})`)}
                </span>
              </div>
              {pending_.map((s, i) => <SubmissionCard key={s.id} s={s} idx={i} />)}
            </>
          )}

          {/* Reviewed */}
          {reviewed.length > 0 && (
            <>
              <div className="px-4 py-2.5 shrink-0" style={{ borderBottom: '1px solid #222', borderTop: pending_.length ? '1px solid #222' : 'none' }}>
                <span className="text-[10px] font-mono tracking-[2px] uppercase" style={{ color: '#4CAF50' }}>
                  {lbl(`Reviewed (${reviewed.length})`, `تمت المراجعة (${reviewed.length})`)}
                </span>
              </div>
              {reviewed.map((s, i) => <SubmissionCard key={s.id} s={s} idx={pending_.length + i} />)}
            </>
          )}

          {!submissions.length && (
            <div className="flex-1 flex items-center justify-center text-sm" style={{ color: '#555' }}>
              {lbl('No submissions yet', 'لا توجد تقارير بعد')}
            </div>
          )}
        </div>

        {/* Right panel — detail */}
        <div className="flex-1 flex flex-col gap-4">
          {selected ? (
            <>
              {/* Header */}
              <div className="rounded-xl px-5 py-4 flex items-center justify-between"
                style={{ background: '#141414', border: '1px solid #222' }}>
                <div className="flex items-center gap-3">
                  <div style={{
                    width: 42, height: 42, borderRadius: 11,
                    background: AV_COLORS[submissions.indexOf(selected) % AV_COLORS.length],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 14, color: '#000',
                  }}>
                    {initials((selected.profiles as any)?.full_name ?? '?')}
                  </div>
                  <div>
                    <Link
                      href={`/trainer/subscribers/${selected.subscriber_id}`}
                      className="font-bold text-white hover:text-brand transition-colors text-sm"
                    >
                      {(selected.profiles as any)?.full_name ?? '—'}
                    </Link>
                    <p className="text-[11px] font-mono" style={{ color: '#555' }}>
                      {lbl(`Week ${selected.week_number}`, `الأسبوع ${selected.week_number}`)}
                      {` · ${timeAgo(selected.submitted_at)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {selected.weight_kg && (
                    <div className="rounded-lg px-3 py-1.5 text-center"
                      style={{ background: 'rgba(200,240,75,0.08)', border: '1px solid rgba(200,240,75,0.15)' }}>
                      <p className="font-mono font-bold text-sm" style={{ color: '#C8F04B' }}>{selected.weight_kg} kg</p>
                      <p className="text-[10px]" style={{ color: '#555' }}>{lbl('Weight', 'الوزن')}</p>
                    </div>
                  )}
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100,
                    background: selected.reviewed ? 'rgba(76,175,80,0.15)' : 'rgba(255,140,66,0.15)',
                    color:      selected.reviewed ? '#4CAF50' : '#FF8C42',
                  }}>
                    {selected.reviewed ? lbl('Reviewed', 'تمت المراجعة') : lbl('Pending', 'بانتظار')}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {selected.notes && (
                <div className="rounded-xl px-5 py-4" style={{ background: '#141414', border: '1px solid #222' }}>
                  <p className="text-[10px] font-mono tracking-[2px] uppercase mb-2" style={{ color: '#555' }}>
                    {lbl('Notes from subscriber', 'ملاحظات المشترك')}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: '#ccc' }}>{selected.notes}</p>
                </div>
              )}

              {/* Photos */}
              {(selected.photos ?? []).length > 0 && (
                <div className="rounded-xl p-4" style={{ background: '#141414', border: '1px solid #222' }}>
                  <p className="text-[10px] font-mono tracking-[2px] uppercase mb-3" style={{ color: '#555' }}>
                    {lbl('Progress Photos', 'صور التقدم')}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(selected.photos ?? []).map((ph, i) => (
                      <button key={i} onClick={() => setLightbox(ph)}
                        className="relative aspect-square rounded-lg overflow-hidden transition-opacity hover:opacity-80"
                        style={{ background: '#222' }}>
                        <Image src={ph} alt="" fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Previous feedback */}
              {(selected.trainer_feedback ?? []).length > 0 && (
                <div className="rounded-xl px-5 py-4" style={{ background: '#141414', border: '1px solid #222' }}>
                  <p className="text-[10px] font-mono tracking-[2px] uppercase mb-3" style={{ color: '#555' }}>
                    {lbl('Previous Feedback', 'الردود السابقة')}
                  </p>
                  <div className="flex flex-col gap-2">
                    {(selected.trainer_feedback ?? []).map((fb, i) => (
                      <div key={i} className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(200,240,75,0.05)', border: '1px solid rgba(200,240,75,0.1)', color: '#ccc' }}>
                        {fb.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback form */}
              <div className="rounded-xl px-5 py-4 flex flex-col gap-3" style={{ background: '#141414', border: '1px solid #222' }}>
                <p className="text-[10px] font-mono tracking-[2px] uppercase" style={{ color: '#555' }}>
                  {lbl('Send Feedback', 'إرسال الرد')}
                </p>
                <textarea
                  className="input resize-none text-sm"
                  style={{ height: 88 }}
                  placeholder={lbl('Write your feedback...', 'اكتب ردك هنا...')}
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                />
                {feedbackErr && (
                  <p className="text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.25)', color: '#FF4D4D' }}>
                    {feedbackErr}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleFeedback}
                    disabled={!feedback.trim() || pending}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-40"
                    style={{ background: '#C8F04B', color: '#000' }}
                  >
                    <Send size={14} />
                    {pending ? lbl('Sending...', 'جارٍ الإرسال...') : lbl('Send Feedback', 'إرسال الرد')}
                  </button>
                  <Link
                    href={`/trainer/plan-builder?sub=${selected.subscription_id}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-white/10"
                    style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc' }}
                  >
                    <FileEdit size={14} />
                    {lbl('Update Plan', 'تعديل الخطة')}
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col gap-2 rounded-xl"
              style={{ background: '#141414', border: '1px solid #222', minHeight: 300, color: '#333' }}>
              <p className="text-3xl">📋</p>
              <p className="text-sm">{lbl('Select a submission to review', 'اختر تقريراً للمراجعة')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Photo lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 flex items-center justify-center rounded-full"
            style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.08)', color: '#fff' }}
            onClick={() => setLightbox(null)}
          >
            <X size={18} />
          </button>
          <div className="relative max-w-2xl w-full max-h-[80vh] aspect-square rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <Image src={lightbox} alt="" fill className="object-contain" />
          </div>
        </div>
      )}
    </div>
  )
}
