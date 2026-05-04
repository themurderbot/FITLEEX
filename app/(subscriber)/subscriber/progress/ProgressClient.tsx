'use client'

import { useState, useTransition, useRef } from 'react'
import { Camera, Scale, X, CheckCircle2, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Subscription {
  id: string
  trainers?: { profiles?: { full_name: string } }
}

interface Submission {
  id: string
  week_number: number
  weight_kg?: number
  notes?: string
  photos?: string[]
  submitted_at: string
  reviewed: boolean
  trainer_feedback?: { message: string; created_at: string }[]
}

interface Props {
  subscriptions: Subscription[]
  submissions:   Submission[]
  currentUserId: string
  activeSubId?:  string
  locale:        string
}

export function ProgressClient({ subscriptions, submissions: initial, currentUserId, activeSubId, locale }: Props) {
  const supabase = createClient()
  const lbl = (en: string, ar: string) => locale === 'ar' ? ar : en

  const [subId,       setSubId]       = useState(activeSubId ?? subscriptions[0]?.id)
  const [submissions, setSubmissions] = useState<Submission[]>(initial)
  const [weight,      setWeight]      = useState('')
  const [notes,       setNotes]       = useState('')
  const [photos,      setPhotos]      = useState<File[]>([])
  const [previews,    setPreviews]    = useState<string[]>([])
  const [pending,     startTrans]     = useTransition()
  const [done,        setDone]        = useState(false)
  const [submitErr,   setSubmitErr]   = useState<string | null>(null)
  const [expanded,    setExpanded]    = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const nextWeek = submissions.length > 0
    ? Math.max(...submissions.map(s => s.week_number)) + 1
    : 1

  function addPhotos(files: FileList | null) {
    if (!files) return
    const arr = Array.from(files).slice(0, 3 - photos.length)
    setPhotos(p => [...p, ...arr])
    arr.forEach(f => {
      const reader = new FileReader()
      reader.onload = e => setPreviews(p => [...p, e.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  function removePhoto(idx: number) {
    setPhotos(p => p.filter((_, i) => i !== idx))
    setPreviews(p => p.filter((_, i) => i !== idx))
  }

  async function uploadPhotos(): Promise<{ urls: string[]; failed: number }> {
    const urls: string[] = []
    let failed = 0
    for (const file of photos) {
      const ext  = file.name.split('.').pop()
      const path = `${currentUserId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('progress-photos').upload(path, file)
      if (!error) {
        const { data } = supabase.storage.from('progress-photos').getPublicUrl(path)
        urls.push(data.publicUrl)
      } else {
        failed++
      }
    }
    return { urls, failed }
  }

  function handleSubmit() {
    if (!subId) return
    setSubmitErr(null)
    startTrans(async () => {
      let photoUrls: string[] = []
      let failedUploads = 0
      if (photos.length > 0) {
        const result = await uploadPhotos()
        photoUrls    = result.urls
        failedUploads = result.failed
      }

      const { data, error } = await (supabase as any).from('progress_submissions').insert({
        subscription_id: subId,
        subscriber_id:   currentUserId,
        week_number:     nextWeek,
        weight_kg:       weight ? Number(weight) : null,
        notes:           notes || null,
        photos:          photoUrls,
      }).select().single()

      if (error || !data) {
        setSubmitErr(lbl('Failed to submit report. Please try again.', 'فشل إرسال التقرير. حاول مجدداً.'))
        return
      }

      setSubmissions(s => [data as Submission, ...s])
      setWeight('')
      setNotes('')
      setPhotos([])
      setPreviews([])

      if (failedUploads > 0) {
        setSubmitErr(lbl(
          `Report submitted, but ${failedUploads} photo(s) failed to upload.`,
          `تم إرسال التقرير، لكن فشل رفع ${failedUploads} صورة.`
        ))
      }

      setDone(true)
      setTimeout(() => setDone(false), 2500)
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/subscriber/plan"
            className="flex items-center justify-center rounded-xl transition-colors hover:bg-white/5"
            style={{ width: 36, height: 36, background: '#141414', border: '1px solid #222' }}>
            <ArrowLeft size={16} style={{ color: '#888' }} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white leading-none">{lbl('PROGRESS', 'التقدم')}</h1>
            <p className="text-xs mt-0.5" style={{ color: '#555' }}>
              {lbl('Track your weekly results', 'تابع نتائجك الأسبوعية')}
            </p>
          </div>
        </div>
      </div>

      {/* Subscription selector */}
      {subscriptions.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {subscriptions.map(s => (
            <button key={s.id} onClick={() => setSubId(s.id)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={subId === s.id
                ? { background: '#C8F04B', color: '#000' }
                : { background: '#141414', border: '1px solid #222', color: '#666' }}>
              {(s.trainers as any)?.profiles?.full_name ?? s.id}
            </button>
          ))}
        </div>
      )}

      {/* Submit form */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#141414', border: '1px solid #222' }}>
        {/* Lime top bar */}
        <div style={{ height: 4, background: 'linear-gradient(90deg,#C8F04B,#7ab82e)' }} />

        <div className="p-4 flex flex-col gap-4">
          <p className="font-black text-white text-sm">
            {lbl(`Week ${nextWeek} Report`, `تقرير الأسبوع ${nextWeek}`)}
          </p>

          {/* Weight */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#888' }}>
              <Scale size={12} /> {lbl('Weight (kg)', 'الوزن (كجم)')}
            </label>
            <input
              type="number" step="0.1"
              placeholder="e.g. 75.5"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              className="rounded-xl text-sm text-white"
              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', padding: '10px 14px', outline: 'none' }}
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: '#888' }}>
              {lbl('Notes', 'ملاحظات')}
            </label>
            <textarea
              rows={3}
              placeholder={lbl('How was the week? Any challenges?', 'كيف كان الأسبوع؟ أي تحديات؟')}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="rounded-xl text-sm text-white resize-none"
              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', padding: '10px 14px', outline: 'none' }}
            />
          </div>

          {/* Photo upload */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#888' }}>
              <Camera size={12} /> {lbl('Progress Photos', 'صور التقدم')} ({photos.length}/3)
            </label>

            <div className="flex gap-2 flex-wrap">
              {previews.map((src, idx) => (
                <div key={idx} className="relative" style={{ width: 80, height: 80 }}>
                  <img src={src} alt="" className="w-full h-full object-cover rounded-xl" />
                  <button
                    onClick={() => removePhoto(idx)}
                    className="absolute -top-1 -right-1 flex items-center justify-center rounded-full"
                    style={{ width: 20, height: 20, background: '#FF4D4D', color: '#fff' }}>
                    <X size={10} />
                  </button>
                </div>
              ))}

              {photos.length < 3 && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-xl gap-1 transition-opacity hover:opacity-80"
                  style={{ width: 80, height: 80, background: '#1a1a1a', border: '2px dashed #333' }}>
                  <Camera size={20} style={{ color: '#555' }} />
                  <span className="text-[9px]" style={{ color: '#555' }}>
                    {lbl('Add', 'إضافة')}
                  </span>
                </button>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => addPhotos(e.target.files)}
            />
          </div>

          {/* Submit button */}
          {done ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.25)' }}>
              <CheckCircle2 size={16} style={{ color: '#4CAF50' }} />
              <span className="text-sm font-bold" style={{ color: '#4CAF50' }}>
                {lbl('Submitted!', 'تم الإرسال!')}
              </span>
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={pending || !subId}
              className="w-full py-3 rounded-xl text-sm font-black transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ background: '#C8F04B', color: '#000' }}>
              {pending
                ? lbl('Uploading...', 'جاري الرفع...')
                : lbl('Submit Report', 'إرسال التقرير')}
            </button>
          )}

          {submitErr && (
            <p className="text-xs text-center rounded-xl px-3 py-2"
              style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.25)', color: '#FF4D4D' }}>
              {submitErr}
            </p>
          )}
        </div>
      </div>

      {/* History */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-bold text-white">{lbl('History', 'السجل')}</p>

        {submissions.length === 0 ? (
          <div className="rounded-2xl py-12 text-center" style={{ background: '#141414', border: '1px solid #222' }}>
            <p className="text-sm" style={{ color: '#555' }}>{lbl('No reports yet', 'لا توجد تقارير بعد')}</p>
          </div>
        ) : (
          submissions.map(sub => {
            const isOpen  = expanded === sub.id
            const feedback = sub.trainer_feedback?.[0]
            return (
              <div key={sub.id} className="rounded-2xl overflow-hidden" style={{ background: '#141414', border: '1px solid #222' }}>
                <button
                  onClick={() => setExpanded(isOpen ? null : sub.id)}
                  className="w-full flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: sub.reviewed ? 'rgba(76,175,80,0.12)' : 'rgba(200,240,75,0.08)',
                      border: `1px solid ${sub.reviewed ? 'rgba(76,175,80,0.3)' : 'rgba(200,240,75,0.2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <span style={{ fontSize: 18 }}>📊</span>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-white text-sm">
                        {lbl(`Week ${sub.week_number}`, `الأسبوع ${sub.week_number}`)}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {sub.weight_kg && (
                          <span className="text-xs" style={{ color: '#666' }}>{sub.weight_kg} kg</span>
                        )}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={sub.reviewed
                            ? { background: 'rgba(76,175,80,0.15)', color: '#4CAF50' }
                            : { background: 'rgba(255,140,66,0.15)', color: '#FF8C42' }}>
                          {sub.reviewed ? lbl('Reviewed ✓', 'تمت المراجعة ✓') : lbl('Pending', 'قيد المراجعة')}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp size={16} style={{ color: '#555' }} /> : <ChevronDown size={16} style={{ color: '#555' }} />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 flex flex-col gap-3" style={{ borderTop: '1px solid #1e1e1e' }}>
                    {/* Photos */}
                    {sub.photos && sub.photos.length > 0 && (
                      <div className="pt-3">
                        <p className="text-xs font-semibold mb-2" style={{ color: '#666' }}>
                          {lbl('Photos', 'الصور')}
                        </p>
                        <div className="flex gap-2">
                          {sub.photos.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                              <img src={url} alt="" className="object-cover rounded-xl"
                                style={{ width: 80, height: 80 }} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {sub.notes && (
                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: '#666' }}>
                          {lbl('Notes', 'ملاحظات')}
                        </p>
                        <p className="text-sm" style={{ color: '#aaa' }}>{sub.notes}</p>
                      </div>
                    )}

                    {/* Trainer feedback */}
                    {feedback && (
                      <div className="rounded-xl p-3"
                        style={{ background: 'rgba(200,240,75,0.06)', border: '1px solid rgba(200,240,75,0.15)' }}>
                        <p className="text-[10px] font-bold mb-1" style={{ color: '#C8F04B' }}>
                          💬 {lbl("Trainer's Feedback", 'ملاحظات المدرب')}
                        </p>
                        <p className="text-sm" style={{ color: '#ddd' }}>{feedback.message}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
