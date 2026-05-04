'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Star, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

const BANNER_COLORS = [
  'linear-gradient(135deg,#1a3a06 0%,#2d5c0a 100%)',
  'linear-gradient(135deg,#0a1f3a 0%,#0d3060 100%)',
  'linear-gradient(135deg,#3a0a0a 0%,#5c1010 100%)',
  'linear-gradient(135deg,#1a0a3a 0%,#2d1060 100%)',
]
const AV_COLORS = [
  'linear-gradient(135deg,#C8F04B,#7ab82e)',
  'linear-gradient(135deg,#60a5fa,#3b82f6)',
  'linear-gradient(135deg,#FF5A36,#cc3d20)',
  'linear-gradient(135deg,#a78bfa,#7c3aed)',
]

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

interface Transformation {
  id: string; before_url: string; after_url: string; caption?: string; caption_ar?: string
}
interface Plan {
  id: string; name: string; name_ar?: string; description?: string; description_ar?: string
  duration_days: number; price: number; currency: string
}
interface Props {
  trainer: any; plans: Plan[]; transformations: Transformation[]
  activePlanId: string | null; locale: string
}

export function TrainerProfileClient({ trainer, plans, transformations, activePlanId, locale }: Props) {
  const lbl = (en: string, ar: string) => locale === 'ar' ? ar : en
  const [slideIdx, setSlideIdx] = useState(0)

  const profile = trainer.profiles ?? {}
  const name    = profile.full_name ?? ''
  const rating  = trainer.rating ?? null
  const stars   = rating ? Math.round(rating) : 0

  return (
    <div className="flex flex-col -mx-4 -mt-5 pb-8">

      {/* ── Banner ── */}
      <div className="relative" style={{ height: 130, background: BANNER_COLORS[0] }}>
        <Link href="/subscriber/trainers"
          className="absolute top-4 left-4 flex items-center justify-center rounded-xl transition-colors"
          style={{ width: 36, height: 36, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}>
          <ArrowLeft size={16} style={{ color: '#fff' }} />
        </Link>

        {/* Avatar */}
        <div className="absolute" style={{ bottom: -38, left: 20 }}>
          <div className="relative">
            <div style={{
              width: 76, height: 76, borderRadius: 22,
              background: AV_COLORS[0],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 26, color: '#000',
              border: '4px solid #0a0a0a',
            }}>
              {initials(name)}
            </div>
            <div className="absolute flex items-center justify-center rounded-full"
              style={{
                width: 22, height: 22, bottom: 0, right: -2,
                background: '#4CAF50', border: '3px solid #0a0a0a',
                fontSize: 10, color: '#fff', fontWeight: 900,
              }}>
              ✓
            </div>
          </div>
        </div>
      </div>

      {/* ── Info ── */}
      <div className="px-5 pt-14 pb-5">
        <p className="font-black text-white text-xl leading-tight">{name}</p>
        <p className="text-sm mt-0.5" style={{ color: '#888' }}>{trainer.specialty}</p>

        {/* Stats */}
        <div className="flex items-center gap-5 mt-4 flex-wrap">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12}
                style={{ color: i < stars ? '#f59e0b' : '#333', fill: i < stars ? '#f59e0b' : 'none' }} />
            ))}
            <span className="font-mono font-black text-white text-sm ml-1">
              {rating ? rating.toFixed(1) : '—'}
            </span>
          </div>
          {trainer.years_experience && (
            <div className="flex items-center gap-1.5">
              <Clock size={13} style={{ color: '#555' }} />
              <span className="font-bold text-white text-sm">{trainer.years_experience}</span>
              <span className="text-xs" style={{ color: '#555' }}>{lbl('yrs exp', 'سنة خبرة')}</span>
            </div>
          )}
        </div>

        {/* Bio */}
        {(locale === 'ar' ? trainer.bio_ar : trainer.bio) && (
          <p className="text-sm mt-4 leading-relaxed" style={{ color: '#999' }}>
            {locale === 'ar' ? (trainer.bio_ar || trainer.bio) : trainer.bio}
          </p>
        )}
      </div>

      <div style={{ height: 1, background: '#1a1a1a' }} />

      {/* ── Transformations ── */}
      <div className="px-5 py-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="font-black text-white text-base">{lbl('Transformations', 'التحولات')}</p>
          {transformations.length > 0 && (
            <p className="text-xs" style={{ color: '#555' }}>{slideIdx + 1} / {transformations.length}</p>
          )}
        </div>

        {transformations.length === 0 ? (
          <div className="rounded-2xl py-10 text-center" style={{ background: '#141414', border: '1px dashed #222' }}>
            <p className="text-3xl mb-2">📸</p>
            <p className="text-xs" style={{ color: '#444' }}>
              {lbl('No transformation photos yet', 'لا توجد صور تحول بعد')}
            </p>
          </div>
        ) : (
          <>
            {/* Before / After slide */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #222' }}>
              <div className="flex" style={{ height: 240 }}>
                {/* Before */}
                <div className="flex-1 relative">
                  <img src={transformations[slideIdx].before_url} alt="Before"
                    className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 flex justify-start p-2"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                    <span className="text-xs font-black text-white px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(0,0,0,0.5)' }}>
                      😓 {lbl('Before', 'قبل')}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ width: 3, background: '#0a0a0a', flexShrink: 0 }} />

                {/* After */}
                <div className="flex-1 relative">
                  <img src={transformations[slideIdx].after_url} alt="After"
                    className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 flex justify-end p-2"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                    <span className="text-xs font-black px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(0,0,0,0.5)', color: '#C8F04B' }}>
                      😎 {lbl('After', 'بعد')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Caption */}
              {transformations[slideIdx].caption && (
                <div className="px-4 py-2.5" style={{ background: '#141414' }}>
                  <p className="text-xs text-center" style={{ color: '#666' }}>
                    {locale === 'ar'
                      ? (transformations[slideIdx].caption_ar || transformations[slideIdx].caption)
                      : transformations[slideIdx].caption}
                  </p>
                </div>
              )}
            </div>

            {/* Dot indicators + nav */}
            {transformations.length > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setSlideIdx(i => Math.max(0, i - 1))}
                  disabled={slideIdx === 0}
                  className="flex items-center justify-center rounded-xl disabled:opacity-25 transition-opacity"
                  style={{ width: 38, height: 38, background: '#141414', border: '1px solid #222' }}>
                  <ChevronLeft size={15} style={{ color: '#888' }} />
                </button>
                <div className="flex gap-1.5">
                  {transformations.map((_, i) => (
                    <button key={i} onClick={() => setSlideIdx(i)}
                      style={{
                        width: i === slideIdx ? 20 : 6, height: 6, borderRadius: 3,
                        background: i === slideIdx ? '#C8F04B' : '#333',
                        transition: 'all 0.2s',
                      }} />
                  ))}
                </div>
                <button onClick={() => setSlideIdx(i => Math.min(transformations.length - 1, i + 1))}
                  disabled={slideIdx === transformations.length - 1}
                  className="flex items-center justify-center rounded-xl disabled:opacity-25 transition-opacity"
                  style={{ width: 38, height: 38, background: '#141414', border: '1px solid #222' }}>
                  <ChevronRight size={15} style={{ color: '#888' }} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ height: 1, background: '#1a1a1a' }} />

      {/* ── Plans ── */}
      <div className="px-5 py-5 flex flex-col gap-3">
        <p className="font-black text-white text-base">{lbl('Plans', 'الخطط')}</p>

        {plans.length === 0 ? (
          <div className="rounded-2xl py-8 text-center" style={{ background: '#141414', border: '1px solid #222' }}>
            <p className="text-sm" style={{ color: '#555' }}>{lbl('No plans available', 'لا توجد خطط متاحة')}</p>
          </div>
        ) : plans.map((plan, idx) => (
          <div key={plan.id} className="rounded-2xl p-4 flex flex-col gap-3"
            style={{
              background: '#141414',
              border: `1px solid ${idx === 0 ? 'rgba(200,240,75,0.25)' : '#222'}`,
            }}>

            {idx === 0 && plans.length > 1 && (
              <span className="self-start text-[10px] font-black px-2.5 py-0.5 rounded-full"
                style={{ background: 'rgba(200,240,75,0.12)', color: '#C8F04B' }}>
                ⭐ {lbl('Most Popular', 'الأكثر طلباً')}
              </span>
            )}

            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-black text-white text-sm">
                  {locale === 'ar' ? (plan.name_ar || plan.name) : plan.name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#555' }}>
                  {plan.duration_days} {lbl('days', 'يوم')}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono font-black text-white text-xl leading-none">{plan.price}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#555' }}>{plan.currency}</p>
              </div>
            </div>

            {(locale === 'ar' ? plan.description_ar : plan.description) && (
              <p className="text-xs leading-relaxed" style={{ color: '#666' }}>
                {locale === 'ar' ? (plan.description_ar || plan.description) : plan.description}
              </p>
            )}

            {activePlanId === plan.id ? (
              <Link href="/subscriber/plan"
                className="w-full py-3 rounded-xl text-sm font-black text-center transition-opacity hover:opacity-80"
                style={{ background: 'rgba(76,175,80,0.1)', color: '#4CAF50', border: '1px solid rgba(76,175,80,0.25)' }}>
                ✓ {lbl('Active — View Plan', 'نشط — عرض الخطة')}
              </Link>
            ) : activePlanId ? (
              <div className="w-full py-3 rounded-xl text-sm font-black text-center"
                style={{ background: '#1a1a1a', color: '#444', border: '1px solid #222' }}>
                {lbl('Already subscribed to another plan', 'مشترك في خطة أخرى')}
              </div>
            ) : (
              <Link href={`/subscriber/checkout?planId=${plan.id}&trainerId=${trainer.id}`}
                className="w-full py-3 rounded-xl text-sm font-black text-center transition-opacity hover:opacity-80"
                style={{ background: '#C8F04B', color: '#000' }}>
                {lbl('Subscribe Now', 'اشترك الآن')}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
