'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MessageSquare, ChevronDown, ChevronRight } from 'lucide-react'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getMealType(time: string): string {
  const h = parseInt(time?.split(':')[0] ?? '12', 10)
  if (h < 10) return 'BREAKFAST'
  if (h < 12) return 'MORNING SNACK'
  if (h < 14) return 'LUNCH'
  if (h < 17) return 'PRE-WORKOUT'
  if (h < 20) return 'DINNER'
  return 'LATE SNACK'
}

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const STATUS_MAP: Record<string, { label: string; labelAr: string; color: string; bg: string }> = {
  active:   { label: 'Active',   labelAr: 'نشط',         color: '#4CAF50', bg: 'rgba(76,175,80,0.15)' },
  expiring: { label: 'Expiring', labelAr: 'ينتهي قريباً', color: '#FF8C42', bg: 'rgba(255,140,66,0.15)' },
  expired:  { label: 'Expired',  labelAr: 'منتهي',        color: '#888',    bg: 'rgba(136,136,136,0.12)' },
  pending:  { label: 'New',      labelAr: 'جديد',         color: '#4D9EFF', bg: 'rgba(77,158,255,0.15)' },
}

interface Props {
  subscriberId: string
  subscriptionId: string
  subscriptionStatus: string
  startDate: string | null
  plan: { name: string; duration_days: number } | null
  profile: { full_name: string; avatar_url?: string }
  workoutPlan: any | null
  nutritionPlan: any | null
  submissions: any[]
  locale: string
}

export function SubscriberProfileClient({
  subscriberId, subscriptionId, subscriptionStatus, startDate,
  plan, profile, workoutPlan, nutritionPlan, submissions, locale,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'workout' | 'nutrition' | 'progress'>('workout')
  const [expandedDay, setExpandedDay] = useState<number | null>(null)
  const lbl = (en: string, ar: string) => locale === 'ar' ? ar : en

  const daysIn = startDate
    ? Math.max(0, Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000))
    : 0
  const totalDays  = plan?.duration_days ?? 0
  const completePct = totalDays > 0 ? Math.min(100, Math.round((daysIn / totalDays) * 100)) : 0
  const lastWeight  = submissions[0]?.weight_kg ? `${submissions[0].weight_kg} kg` : '—'

  const workoutDays = Array.from({ length: 7 }, (_, i) => {
    const dbDay = (workoutPlan?.workout_days ?? []).find((d: any) => d.day_number === i + 1)
    const exercises = (dbDay?.exercises ?? []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    return {
      dayNum:  i + 1,
      dayName: DAY_NAMES[i],
      label:   dbDay?.label ?? 'Rest',
      exercises,
      isRest:  !dbDay || exercises.length === 0,
    }
  })

  const trainingDays = workoutDays.filter(d => !d.isRest).length
  const meals = [...(nutritionPlan?.meals ?? [])].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  const totalKcal = meals.reduce((s: number, m: any) => s + (m.kcal ?? 0), 0)

  const statusInfo = STATUS_MAP[subscriptionStatus] ?? STATUS_MAP.active

  const tabs = [
    { key: 'workout',   icon: '💪', en: 'Workout Plan',    ar: 'خطة التمارين' },
    { key: 'nutrition', icon: '🥗', en: 'Nutrition Plan',  ar: 'الخطة الغذائية' },
    { key: 'progress',  icon: '📊', en: 'Progress',        ar: 'التقدم' },
  ] as const

  return (
    <div className="flex flex-col">
      {/* Back */}
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5"
          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888' }}>
          ← {lbl('Back', 'رجوع')}
        </button>
      </div>

      {/* Profile header */}
      <div className="rounded-xl" style={{ background: '#141414', border: '1px solid #222' }}>
        <div className="flex items-center gap-4 px-5 py-5">
          <div style={{
            width: 58, height: 58, borderRadius: 14, flexShrink: 0,
            background: 'linear-gradient(135deg,#C8F04B,#7ab82e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 22, color: '#000',
          }}>
            {initials(profile.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold text-white leading-tight">{profile.full_name}</h1>
            <p className="text-sm mt-0.5" style={{ color: '#666' }}>
              {plan?.name ?? '—'} · {totalDays} {lbl('days', 'يوم')}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/trainer/chat?sub=${subscriberId}`}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors hover:bg-white/10"
              style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#ccc' }}>
              <MessageSquare size={13} />
              {lbl('Message', 'رسالة')}
            </Link>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 100,
              background: statusInfo.bg, color: statusInfo.color,
            }}>
              {locale === 'ar' ? statusInfo.labelAr : statusInfo.label}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', borderTop: '1px solid #222' }}>
          {[
            { label: lbl('DAY', 'اليوم'),            value: daysIn,              accent: true  },
            { label: lbl('TOTAL DAYS', 'إجمالي'),    value: totalDays,           accent: false },
            { label: lbl('COMPLETE', 'منجز'),         value: `${completePct}%`,   accent: true  },
            { label: lbl('PROGRESS LOGS', 'تقارير'), value: submissions.length,  accent: false },
            { label: lbl('WEIGHT', 'الوزن'),          value: lastWeight,          accent: false },
          ].map((stat, i, arr) => (
            <div key={stat.label} style={{
              textAlign: 'center', padding: '18px 8px',
              borderRight: i < arr.length - 1 ? '1px solid #222' : undefined,
            }}>
              <div style={{
                fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)',
                color: stat.accent ? '#C8F04B' : '#fff', marginBottom: 5,
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 9, letterSpacing: 2, color: '#555', fontFamily: 'monospace' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 mt-6" style={{ borderBottom: '1px solid #222' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors"
            style={{
              color:      tab === t.key ? '#C8F04B' : '#555',
              background: 'transparent', border: 'none', cursor: 'pointer',
            }}>
            <span>{t.icon}</span>
            <span>{lbl(t.en, t.ar)}</span>
            {tab === t.key && (
              <span className="absolute bottom-0 left-0 right-0" style={{ height: 2, background: '#C8F04B', borderRadius: '2px 2px 0 0' }} />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-5">

        {/* ── WORKOUT PLAN ── */}
        {tab === 'workout' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-mono" style={{ color: '#555' }}>
                {lbl(`${trainingDays > 0 ? workoutDays.filter(d => !d.isRest).map(d => d.dayName).join(', ') + ` · ${trainingDays} training days` : 'No training days yet'}`,
                  `${trainingDays} أيام تدريب`)}
              </p>
              <Link href={`/trainer/plan-builder?sub=${subscriptionId}`}
                className="text-xs px-3 py-1.5 rounded-lg font-bold transition-opacity hover:opacity-80"
                style={{ background: '#C8F04B', color: '#000' }}>
                {lbl('Edit Plan', 'تعديل الخطة')}
              </Link>
            </div>

            {!workoutPlan ? (
              <div className="rounded-xl py-12 text-center" style={{ background: '#141414', border: '1px solid #222' }}>
                <p className="text-sm mb-4" style={{ color: '#555' }}>
                  {lbl('No workout plan added yet', 'لا توجد خطة تمارين بعد')}
                </p>
                <Link href={`/trainer/plan-builder?sub=${subscriptionId}`}
                  className="text-xs px-4 py-2 rounded-lg font-bold transition-opacity hover:opacity-80"
                  style={{ background: '#C8F04B', color: '#000' }}>
                  {lbl('Build Plan', 'بناء الخطة')}
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {workoutDays.map(day => (
                  <div key={day.dayNum} className="rounded-xl overflow-hidden" style={{ border: '1px solid #222' }}>
                    <button
                      onClick={() => !day.isRest && setExpandedDay(expandedDay === day.dayNum ? null : day.dayNum)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors"
                      style={{ background: '#141414', cursor: day.isRest ? 'default' : 'pointer' }}
                    >
                      <div style={{
                        width: 44, height: 26, borderRadius: 6, flexShrink: 0,
                        background: day.isRest ? '#1e1e1e' : '#C8F04B',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 900, color: day.isRest ? '#444' : '#000',
                        fontFamily: 'monospace', letterSpacing: 1,
                      }}>
                        {day.dayName}
                      </div>
                      <span className="text-sm font-semibold text-white flex-1 text-start">{day.label}</span>
                      {!day.isRest && (
                        <span className="text-[11px] font-mono" style={{ color: '#555' }}>
                          {day.exercises.length} {lbl('exercises', 'تمرين')}
                        </span>
                      )}
                      {day.isRest
                        ? <span style={{ fontSize: 14 }}>😴</span>
                        : (expandedDay === day.dayNum
                          ? <ChevronDown size={14} color="#555" />
                          : <ChevronRight size={14} color="#555" />)}
                    </button>

                    {expandedDay === day.dayNum && day.exercises.length > 0 && (
                      <div style={{ borderTop: '1px solid #1e1e1e', background: '#0e0e0e' }}>
                        {day.exercises.map((ex: any, i: number) => (
                          <div key={ex.id ?? i} className="flex items-center gap-3 px-5 py-2.5"
                            style={{ borderBottom: '1px solid #1a1a1a' }}>
                            <div style={{ width: 6, height: 6, borderRadius: 3, background: '#C8F04B', flexShrink: 0 }} />
                            <span className="text-sm text-white flex-1">{ex.name}</span>
                            <span className="text-xs font-mono" style={{ color: '#555' }}>
                              {ex.sets}×{ex.reps} · {ex.rest_seconds}s
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── NUTRITION PLAN ── */}
        {tab === 'nutrition' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-mono" style={{ color: '#555' }}>
                {meals.length} {lbl('meals', 'وجبات')} · {totalKcal.toLocaleString()} kcal · {lbl('repeats daily', 'يومياً')}
              </p>
              <Link href={`/trainer/plan-builder?sub=${subscriptionId}&tab=nutrition`}
                className="text-xs px-3 py-1.5 rounded-lg font-bold transition-opacity hover:opacity-80"
                style={{ background: '#C8F04B', color: '#000' }}>
                {lbl('Edit', 'تعديل')}
              </Link>
            </div>

            {!nutritionPlan || meals.length === 0 ? (
              <div className="rounded-xl py-12 text-center text-sm" style={{ background: '#141414', border: '1px solid #222', color: '#555' }}>
                {lbl('No nutrition plan added yet', 'لا توجد خطة غذائية بعد')}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {meals.map((meal: any) => (
                  <div key={meal.id} className="rounded-xl flex items-center gap-4 px-5 py-4"
                    style={{ background: '#141414', border: '1px solid #222' }}>
                    <div className="shrink-0" style={{ minWidth: 56 }}>
                      <p className="font-mono font-black text-lg leading-none" style={{ color: '#C8F04B' }}>{meal.meal_time}</p>
                      <p className="text-[9px] tracking-widest mt-0.5" style={{ color: '#555' }}>{getMealType(meal.meal_time)}</p>
                    </div>
                    <div className="flex items-center justify-center shrink-0"
                      style={{ width: 42, height: 42, borderRadius: 10, background: '#1e1e1e', fontSize: 20 }}>
                      🍽️
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{meal.name}</p>
                      {meal.ingredients && (
                        <p className="text-[11px] mt-0.5 truncate" style={{ color: '#666' }}>{meal.ingredients}</p>
                      )}
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {meal.kcal      > 0 && <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold" style={{ background: 'rgba(200,240,75,0.12)', color: '#C8F04B' }}>{meal.kcal} kcal</span>}
                        {meal.protein_g > 0 && <span className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(77,158,255,0.12)', color: '#4D9EFF' }}>{meal.protein_g}g protein</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PROGRESS ── */}
        {tab === 'progress' && (
          <div className="flex flex-col gap-3">
            {submissions.length === 0 ? (
              <div className="rounded-xl py-12 text-center text-sm" style={{ background: '#141414', border: '1px solid #222', color: '#555' }}>
                {lbl('No progress submissions yet', 'لا توجد تقارير بعد')}
              </div>
            ) : (
              submissions.map((sub, idx) => {
                const prev = submissions[idx + 1]
                const weightChange = prev?.weight_kg && sub.weight_kg ? sub.weight_kg - prev.weight_kg : null
                return (
                  <div key={sub.id} className="rounded-xl p-4" style={{ background: '#141414', border: '1px solid #222' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-white">
                        {lbl(`Week ${sub.week_number}`, `الأسبوع ${sub.week_number}`)}
                      </span>
                      {weightChange !== null && (
                        <span className="text-sm font-mono font-bold" style={{ color: weightChange <= 0 ? '#4CAF50' : '#FF8C42' }}>
                          {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {[0, 1].map(i => (
                        <div key={i} style={{
                          width: 64, height: 64, borderRadius: 10, flexShrink: 0,
                          background: '#1e1e1e', border: '1px solid #2a2a2a',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                        }}>
                          📷
                        </div>
                      ))}
                      <div className="flex-1 min-w-0">
                        {sub.reviewed ? (
                          <p className="text-xs font-semibold" style={{ color: '#4CAF50' }}>
                            {lbl('Feedback sent ✓', 'تم إرسال الرد ✓')}
                          </p>
                        ) : (
                          <p className="text-xs" style={{ color: '#888' }}>
                            {lbl('Awaiting feedback', 'بانتظار الرد')}
                          </p>
                        )}
                        {sub.notes && (
                          <p className="text-[11px] mt-1 line-clamp-2" style={{ color: '#555' }}>{sub.notes}</p>
                        )}
                      </div>
                      {!sub.reviewed && (
                        <Link href="/trainer/progress"
                          className="text-xs px-3 py-1.5 rounded-lg shrink-0 transition-colors hover:bg-white/10"
                          style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#ccc' }}>
                          {lbl('Give feedback', 'إرسال رد')}
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
