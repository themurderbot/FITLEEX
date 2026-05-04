'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, Check, BarChart2, Play, ChevronDown, ChevronUp } from 'lucide-react'

interface Exercise {
  id: string; name: string; name_ar: string; sets: number
  reps: string; rest_seconds: number; video_url?: string
}
interface Day { id: string; day_number: number; label?: string; exercises: Exercise[] }
interface Meal {
  id: string; meal_time: string; name: string; name_ar: string
  kcal?: number; protein_g?: number; carbs_g?: number; fat_g?: number
  ingredients?: string; preparation_steps?: string; photo_urls?: string[]
}
interface Submission {
  id: string; week_number: number; weight_kg?: number; notes?: string
  photos?: string[]; reviewed: boolean; submitted_at: string
  trainer_feedback?: { message: string; created_at: string }[]
}

interface Props {
  planId:      string
  weekNumber:  number
  startDate:   string | null
  trainerName: string
  days:        Day[]
  meals:       Meal[]
  submissions: Submission[]
  showBack:    boolean
  locale:      string
}

const DAY_SHORT    = ['SUN','MON','TUE','WED','THU','FRI','SAT']
const DAY_SHORT_AR = ['أح','إث','ثل','أر','خم','جم','سب']
const MONTH_SHORT  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getExerciseIcon(name: string): { emoji: string; bg: string } {
  const n = name.toLowerCase()
  if (n.includes('bench') || n.includes('press') || n.includes('fly'))
    return { emoji: '🏋️', bg: 'linear-gradient(135deg,#1a3a06,#2d5c0a)' }
  if (n.includes('pull') || n.includes('row') || n.includes('deadlift'))
    return { emoji: '💪', bg: 'linear-gradient(135deg,#0a1f3a,#0d3060)' }
  if (n.includes('curl') || n.includes('tricep') || n.includes('overhead'))
    return { emoji: '💪', bg: 'linear-gradient(135deg,#2d0a3a,#4a1060)' }
  if (n.includes('squat') || n.includes('leg') || n.includes('calf') || n.includes('lunge'))
    return { emoji: '🦵', bg: 'linear-gradient(135deg,#3a1a06,#5c2a0a)' }
  if (n.includes('treadmill') || n.includes('run') || n.includes('cardio') || n.includes('walk'))
    return { emoji: '🏃', bg: 'linear-gradient(135deg,#0a2a2a,#0d4040)' }
  if (n.includes('plank') || n.includes('crunch') || n.includes('mountain') || n.includes('raise'))
    return { emoji: '🔥', bg: 'linear-gradient(135deg,#3a2a00,#5c4400)' }
  if (n.includes('shoulder') || n.includes('lateral') || n.includes('front') || n.includes('face'))
    return { emoji: '🎯', bg: 'linear-gradient(135deg,#003a2a,#005c40)' }
  return { emoji: '💪', bg: 'linear-gradient(135deg,#1a1a1a,#2a2a2a)' }
}

export function PlanClient({ planId, weekNumber, startDate, trainerName, days, meals, submissions, showBack, locale }: Props) {
  const lbl = (en: string, ar: string) => locale === 'ar' ? ar : en

  const [tab,       setTab]       = useState<'workout' | 'nutrition' | 'progress'>('workout')
  const [activeDay, setActiveDay] = useState(0)
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [expanded,  setExpanded]  = useState<string | null>(null)
  const [mealSheet, setMealSheet] = useState<Meal | null>(null)
  const [photoIdx,  setPhotoIdx]  = useState(0)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`plan-${planId}-done`)
      if (stored) setCompleted(new Set(JSON.parse(stored)))
    } catch {}
  }, [planId])

  function toggleDone(exId: string) {
    setCompleted(prev => {
      const next = new Set(prev)
      next.has(exId) ? next.delete(exId) : next.add(exId)
      try { localStorage.setItem(`plan-${planId}-done`, JSON.stringify(Array.from(next))) } catch {}
      return next
    })
  }

  const weekStart = startDate
    ? new Date(new Date(startDate).getTime() + (weekNumber - 1) * 7 * 86400000)
    : null
  const weekEnd = weekStart ? new Date(weekStart.getTime() + 6 * 86400000) : null

  function fmtRange() {
    if (!weekStart || !weekEnd) return ''
    return `${MONTH_SHORT[weekStart.getMonth()]} ${weekStart.getDate()} – ${MONTH_SHORT[weekEnd.getMonth()]} ${weekEnd.getDate()}`
  }

  const currentDay = days[activeDay]

  // Weekly update from latest 2 submissions
  const latest = submissions[0] ?? null
  const prev   = submissions[1] ?? null
  const weightChange = latest?.weight_kg && prev?.weight_kg
    ? latest.weight_kg - prev.weight_kg : null

  const tabs = [
    { key: 'workout'   as const, labelEn: 'Workout',   labelAr: 'التمارين' },
    { key: 'nutrition' as const, labelEn: 'Nutrition', labelAr: 'التغذية'  },
    { key: 'progress'  as const, labelEn: 'Progress',  labelAr: 'التقدم'   },
  ]

  return (
    <>
    <div className="flex flex-col gap-0 -mx-4 -mt-5">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <div className="flex items-center gap-3">
          {showBack && (
            <Link href="/subscriber/plan"
              className="flex items-center justify-center rounded-xl transition-colors hover:bg-white/5"
              style={{ width: 36, height: 36, background: '#141414', border: '1px solid #222' }}>
              <ArrowLeft size={16} style={{ color: '#888' }} />
            </Link>
          )}
          <div>
            <h1 className="text-xl font-black text-white leading-none">{lbl('MY PLANS', 'خططي')}</h1>
            <p className="text-xs mt-0.5" style={{ color: '#C8F04B' }}>{trainerName}</p>
          </div>
        </div>
        <Link href="/subscriber/progress"
          className="flex items-center justify-center rounded-xl"
          style={{ width: 36, height: 36, background: '#141414', border: '1px solid #222' }}>
          <BarChart2 size={16} style={{ color: '#888' }} />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex px-4 gap-1" style={{ borderBottom: '1px solid #1e1e1e' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2.5 text-sm font-bold transition-colors relative"
            style={{ color: tab === t.key ? '#C8F04B' : '#555' }}>
            {lbl(t.labelEn, t.labelAr)}
            {tab === t.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ background: '#C8F04B' }} />
            )}
          </button>
        ))}
      </div>

      {/* ═══ WORKOUT TAB ═══ */}
      {tab === 'workout' && (
        <div className="flex flex-col gap-4 px-4 pt-4 pb-6">

          {/* Week selector */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-black text-white text-base">{lbl(`Week ${weekNumber}`, `الأسبوع ${weekNumber}`)}</p>
              {weekStart && <p className="text-xs mt-0.5" style={{ color: '#555' }}>{fmtRange()}</p>}
            </div>
            <div className="flex gap-1">
              <Link href="/subscriber/plan"
                className="flex items-center justify-center rounded-lg transition-colors hover:bg-white/5"
                style={{ width: 32, height: 32, background: '#141414', border: '1px solid #222' }}>
                <ChevronLeft size={14} style={{ color: '#666' }} />
              </Link>
              <button disabled className="flex items-center justify-center rounded-lg opacity-30"
                style={{ width: 32, height: 32, background: '#141414', border: '1px solid #222' }}>
                <ChevronRight size={14} style={{ color: '#666' }} />
              </button>
            </div>
          </div>

          {/* Day selector */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {days.map((day, idx) => {
              const dayDate   = weekStart ? new Date(weekStart.getTime() + (day.day_number - 1) * 86400000) : null
              const calDayIdx = dayDate ? dayDate.getDay() : -1
              const isActive  = idx === activeDay
              const isToday   = dayDate ? dayDate.toDateString() === new Date().toDateString() : false
              const shortName = dayDate
                ? (locale === 'ar' ? DAY_SHORT_AR[calDayIdx] : DAY_SHORT[calDayIdx])
                : `D${day.day_number}`
              const dateNum = dayDate ? dayDate.getDate() : day.day_number
              return (
                <button key={day.id} onClick={() => setActiveDay(idx)}
                  className="flex flex-col items-center gap-1 shrink-0 rounded-2xl py-2.5 transition-all"
                  style={{
                    width: 52,
                    background: isActive ? '#C8F04B' : isToday ? 'rgba(200,240,75,0.1)' : '#141414',
                    border: isActive ? 'none' : isToday ? '1px solid rgba(200,240,75,0.3)' : '1px solid #222',
                  }}>
                  <span className="text-[10px] font-bold" style={{ color: isActive ? '#000' : '#666' }}>
                    {shortName}
                  </span>
                  <span className="font-black text-base leading-none"
                    style={{ color: isActive ? '#000' : isToday ? '#C8F04B' : '#fff' }}>
                    {dateNum}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Day label */}
          {currentDay && (
            <p className="text-xs font-bold" style={{ color: '#888' }}>
              {currentDay.label ?? lbl(`Day ${currentDay.day_number}`, `اليوم ${currentDay.day_number}`)}
            </p>
          )}

          {/* Exercises */}
          <div className="flex flex-col gap-2">
            {!currentDay || currentDay.exercises.length === 0 ? (
              <div className="rounded-2xl py-10 text-center" style={{ background: '#141414', border: '1px solid #222' }}>
                <p className="text-2xl mb-2">🛌</p>
                <p className="text-sm" style={{ color: '#555' }}>{lbl('Rest Day', 'يوم راحة')}</p>
              </div>
            ) : currentDay.exercises.map(ex => {
              const { emoji, bg } = getExerciseIcon(ex.name)
              const done = completed.has(ex.id)
              return (
                <div key={ex.id} className="flex items-center gap-3 rounded-2xl p-3"
                  style={{ background: '#141414', border: `1px solid ${done ? 'rgba(200,240,75,0.2)' : '#222'}` }}>
                  <div className="shrink-0 flex items-center justify-center rounded-xl text-lg"
                    style={{ width: 44, height: 44, background: bg }}>
                    {emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-white">
                      {locale === 'ar' ? (ex.name_ar || ex.name) : ex.name}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: '#666' }}>
                      {ex.sets} {lbl('sets', 'مج')} × {ex.reps} {lbl('reps', 'تك')}
                      {ex.rest_seconds ? ` · ${ex.rest_seconds}s` : ''}
                    </p>
                  </div>
                  {ex.video_url && (
                    <a href={ex.video_url} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 flex items-center justify-center rounded-lg"
                      style={{ width: 28, height: 28, background: 'rgba(200,240,75,0.1)' }}>
                      <Play size={12} style={{ color: '#C8F04B' }} />
                    </a>
                  )}
                  <button onClick={() => toggleDone(ex.id)} className="shrink-0"
                    style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: done ? '#C8F04B' : 'transparent',
                      border: done ? 'none' : '2px solid #333',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                    {done && <Check size={14} style={{ color: '#000', strokeWidth: 3 }} />}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Weekly Update card */}
          {latest && (
            <div className="rounded-2xl p-4" style={{ background: 'rgba(200,240,75,0.06)', border: '1px solid rgba(200,240,75,0.2)' }}>
              <p className="text-xs font-bold mb-3" style={{ color: '#C8F04B' }}>
                📊 {lbl('Weekly Update', 'تحديث أسبوعي')}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl p-2 text-center" style={{ background: '#111' }}>
                  <p className="font-mono font-black text-white text-lg leading-none">{latest.weight_kg ?? '—'}</p>
                  <p className="text-[10px] mt-1" style={{ color: '#555' }}>kg</p>
                </div>
                <div className="rounded-xl p-2 text-center" style={{ background: '#111' }}>
                  <p className="font-mono font-black text-lg leading-none"
                    style={{ color: weightChange !== null ? (weightChange <= 0 ? '#4CAF50' : '#FF8C42') : '#fff' }}>
                    {weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}` : '—'}
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: '#555' }}>{lbl('Change', 'تغيير')}</p>
                </div>
                <div className="rounded-xl p-2 text-center" style={{ background: '#111' }}>
                  <p className="font-mono font-black text-white text-lg leading-none">W{latest.week_number}</p>
                  <p className="text-[10px] mt-1" style={{ color: '#555' }}>{lbl('Week', 'أسبوع')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ NUTRITION TAB ═══ */}
      {tab === 'nutrition' && (
        <div className="flex flex-col pb-6">
          {meals.length === 0 ? (
            <div className="mx-4 mt-4 rounded-2xl py-16 text-center" style={{ background: '#141414', border: '1px solid #222' }}>
              <p className="text-3xl mb-3">🥗</p>
              <p className="text-sm" style={{ color: '#555' }}>
                {lbl('No nutrition plan yet', 'لا توجد خطة غذائية بعد')}
              </p>
            </div>
          ) : (
            <>
              {/* Meals list */}
              <div className="flex flex-col">
                {meals.map((meal, idx) => (
                  <div key={meal.id} className="flex gap-0 cursor-pointer active:bg-white/5 transition-colors"
                    style={{ borderBottom: idx < meals.length - 1 ? '1px solid #1a1a1a' : 'none' }}
                    onClick={() => { setMealSheet(meal); setPhotoIdx(0) }}>

                    {/* Time column */}
                    <div className="shrink-0 px-4 pt-4 pb-4 text-right" style={{ width: 72 }}>
                      <p className="font-mono font-black text-sm leading-none" style={{ color: '#C8F04B' }}>
                        {meal.time ?? '—'}
                      </p>
                      <p className="text-[9px] mt-1 uppercase tracking-wider" style={{ color: '#444' }}>
                        {meal.meal_time}
                      </p>
                    </div>

                    {/* Divider */}
                    <div style={{ width: 1, background: '#1e1e1e', margin: '16px 0' }} />

                    {/* Content */}
                    <div className="flex-1 px-4 pt-4 pb-4 flex gap-3">
                      {/* Photos */}
                      {meal.photo_urls && meal.photo_urls.length > 0 ? (
                        <div className="shrink-0 flex gap-1.5">
                          {meal.photo_urls.slice(0, 3).map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                              <img src={url} alt=""
                                className="rounded-xl object-cover"
                                style={{ width: 52, height: 52 }} />
                            </a>
                          ))}
                          {meal.photo_urls.length > 3 && (
                            <div className="rounded-xl flex items-center justify-center text-xs font-bold"
                              style={{ width: 52, height: 52, background: '#1a1a1a', border: '1px solid #252525', color: '#888' }}>
                              +{meal.photo_urls.length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="shrink-0 rounded-xl flex items-center justify-center text-lg"
                          style={{ width: 52, height: 52, background: '#1a1a1a', border: '1px solid #252525' }}>
                          🍽️
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        {/* Name */}
                        <p className="font-bold text-white text-sm leading-tight">
                          {locale === 'ar' ? (meal.name_ar || meal.name) : meal.name}
                        </p>

                        {/* Ingredients */}
                        {meal.ingredients && (
                          <p className="text-[11px] mt-1 leading-relaxed" style={{ color: '#666' }}>
                            {meal.ingredients}
                          </p>
                        )}

                        {/* Prep steps */}
                        {meal.preparation_steps && (
                          <div className="mt-2 rounded-lg p-2" style={{ background: '#1a1a1a' }}>
                            {meal.preparation_steps.split('\n').map((step, i) => (
                              <p key={i} className="text-[11px] leading-relaxed" style={{ color: '#555' }}>{step}</p>
                            ))}
                          </div>
                        )}

                        {/* Macro badges */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {meal.kcal && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(200,240,75,0.12)', color: '#C8F04B' }}>
                              {meal.kcal} kcal
                            </span>
                          )}
                          {meal.protein_g != null && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}>
                              {meal.protein_g}g {lbl('protein', 'بروتين')}
                            </span>
                          )}
                          {meal.carbs_g != null && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(251,146,60,0.12)', color: '#fb923c' }}>
                              {meal.carbs_g}g {lbl('carbs', 'كارب')}
                            </span>
                          )}
                          {meal.fat_g != null && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7' }}>
                              {meal.fat_g}g {lbl('fat', 'دهون')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Daily totals */}
              {(() => {
                const totals = meals.reduce((acc, m) => ({
                  kcal:    acc.kcal    + (m.kcal      ?? 0),
                  protein: acc.protein + (m.protein_g  ?? 0),
                  carbs:   acc.carbs   + (m.carbs_g    ?? 0),
                  fat:     acc.fat     + (m.fat_g      ?? 0),
                }), { kcal: 0, protein: 0, carbs: 0, fat: 0 })
                return (
                  <div className="mx-4 mt-4 rounded-2xl p-4" style={{ background: '#141414', border: '1px solid #222' }}>
                    <p className="text-xs font-bold mb-3 text-white">{lbl('Daily Totals', 'المجموع اليومي')}</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { val: totals.kcal,             label: 'KCAL',    color: '#C8F04B' },
                        { val: `${totals.protein}g`,    label: lbl('PROTEIN', 'بروتين'), color: '#60a5fa' },
                        { val: `${totals.carbs}g`,      label: lbl('CARBS', 'كارب'),    color: '#fb923c' },
                        { val: `${totals.fat}g`,        label: lbl('FAT', 'دهون'),      color: '#a855f7' },
                      ].map(s => (
                        <div key={s.label} className="text-center">
                          <p className="font-mono font-black text-base leading-none" style={{ color: s.color }}>{s.val}</p>
                          <p className="text-[9px] mt-1 uppercase tracking-widest" style={{ color: '#555' }}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </>
          )}
        </div>
      )}

      {/* ═══ PROGRESS TAB ═══ */}
      {tab === 'progress' && (
        <div className="flex flex-col gap-4 px-4 pt-4 pb-6">

          {/* Submit CTA */}
          <Link href="/subscriber/progress"
            className="flex items-center justify-between rounded-2xl px-4 py-4 transition-opacity hover:opacity-80"
            style={{ background: 'rgba(200,240,75,0.08)', border: '1px solid rgba(200,240,75,0.2)' }}>
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 22 }}>📸</span>
              <div>
                <p className="text-sm font-bold text-white">{lbl('Submit Weekly Report', 'أرسل تقرير الأسبوع')}</p>
                <p className="text-[11px]" style={{ color: '#888' }}>{lbl('Weight + photos', 'الوزن والصور')}</p>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: '#C8F04B' }} />
          </Link>

          {/* History */}
          <p className="text-sm font-bold text-white">{lbl('History', 'السجل')}</p>

          {submissions.length === 0 ? (
            <div className="rounded-2xl py-12 text-center" style={{ background: '#141414', border: '1px solid #222' }}>
              <p className="text-sm" style={{ color: '#555' }}>{lbl('No reports yet', 'لا توجد تقارير بعد')}</p>
            </div>
          ) : submissions.map(sub => {
            const isOpen   = expanded === sub.id
            const feedback = sub.trainer_feedback?.[0]
            return (
              <div key={sub.id} className="rounded-2xl overflow-hidden"
                style={{ background: '#141414', border: '1px solid #222' }}>

                {/* Row */}
                <button onClick={() => setExpanded(isOpen ? null : sub.id)}
                  className="w-full flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      background: sub.reviewed ? 'rgba(76,175,80,0.12)' : 'rgba(200,240,75,0.08)',
                      border: `1px solid ${sub.reviewed ? 'rgba(76,175,80,0.3)' : 'rgba(200,240,75,0.2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>
                      📊
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
                  {isOpen
                    ? <ChevronUp size={16} style={{ color: '#555' }} />
                    : <ChevronDown size={16} style={{ color: '#555' }} />}
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div className="px-4 pb-4 flex flex-col gap-3" style={{ borderTop: '1px solid #1e1e1e' }}>

                    {/* Photos */}
                    {sub.photos && sub.photos.length > 0 && (
                      <div className="pt-3">
                        <p className="text-xs font-semibold mb-2" style={{ color: '#666' }}>
                          {lbl('Photos', 'الصور')}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {sub.photos.map((url: string, i: number) => (
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
          })}
        </div>
      )}
    </div>

    {/* ── Meal Detail Modal ── */}
    {mealSheet && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
        onClick={() => setMealSheet(null)}>

        <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
          style={{ background: '#141414', border: '1px solid #222', maxHeight: '88dvh' }}
          onClick={e => e.stopPropagation()}>

          {/* Header bar with close */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0"
            style={{ borderBottom: '1px solid #1e1e1e' }}>
            <div>
              <p className="font-bold text-white text-base leading-tight">
                {locale === 'ar' ? (mealSheet.name_ar || mealSheet.name) : mealSheet.name}
              </p>
              <p className="text-xs mt-0.5 font-mono" style={{ color: '#C8F04B' }}>
                {mealSheet.meal_time}
              </p>
            </div>
            <button onClick={() => setMealSheet(null)}
              className="flex items-center justify-center rounded-full text-sm font-bold shrink-0"
              style={{ width: 30, height: 30, background: '#222', color: '#888' }}>
              ✕
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex flex-col">

            {/* Photo carousel */}
            {mealSheet.photo_urls && mealSheet.photo_urls.length > 0 && (
              <div className="relative shrink-0" style={{ height: 200 }}>
                <img src={mealSheet.photo_urls[photoIdx]} alt=""
                  className="w-full h-full object-cover" />
                {mealSheet.photo_urls.length > 1 && (
                  <>
                    <button onClick={() => setPhotoIdx(i => (i - 1 + mealSheet.photo_urls!.length) % mealSheet.photo_urls!.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full"
                      style={{ width: 30, height: 30, background: 'rgba(0,0,0,0.65)' }}>
                      <ChevronLeft size={16} color="#fff" />
                    </button>
                    <button onClick={() => setPhotoIdx(i => (i + 1) % mealSheet.photo_urls!.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full"
                      style={{ width: 30, height: 30, background: 'rgba(0,0,0,0.65)' }}>
                      <ChevronRight size={16} color="#fff" />
                    </button>
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                      {mealSheet.photo_urls.map((_, i) => (
                        <button key={i} onClick={() => setPhotoIdx(i)}
                          className="rounded-full transition-all"
                          style={{ width: i === photoIdx ? 14 : 5, height: 5,
                            background: i === photoIdx ? '#C8F04B' : 'rgba(255,255,255,0.35)' }} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Details */}
            <div className="px-5 py-4 flex flex-col gap-4">

              {/* Macros */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                {[
                  { label: 'Kcal',                     value: mealSheet.kcal,      unit: '',  color: '#C8F04B' },
                  { label: lbl('Protein', 'بروتين'),   value: mealSheet.protein_g, unit: 'g', color: '#60a5fa' },
                  { label: lbl('Carbs',   'كارب'),     value: mealSheet.carbs_g,   unit: 'g', color: '#f97316' },
                  { label: lbl('Fat',     'دهون'),     value: mealSheet.fat_g,     unit: 'g', color: '#a78bfa' },
                ].map(m => (
                  <div key={m.label} className="rounded-2xl py-3 text-center"
                    style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}>
                    <p className="font-black text-sm leading-none" style={{ color: m.color }}>
                      {m.value ?? 0}{m.unit}
                    </p>
                    <p className="text-[9px] mt-1.5 uppercase tracking-wider" style={{ color: '#555' }}>{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Ingredients */}
              {mealSheet.ingredients && (
                <div className="rounded-2xl p-4" style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#555' }}>
                    {lbl('Ingredients', 'المكونات')}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: '#bbb' }}>
                    {mealSheet.ingredients}
                  </p>
                </div>
              )}

              {/* Prep steps */}
              {mealSheet.preparation_steps && (
                <div className="rounded-2xl p-4" style={{ background: '#1e1e1e', border: '1px solid #2a2a2a' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#555' }}>
                    {lbl('Preparation', 'طريقة التحضير')}
                  </p>
                  <div className="flex flex-col gap-3">
                    {mealSheet.preparation_steps.split('\n').filter(Boolean).map((step, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <span className="shrink-0 rounded-full flex items-center justify-center text-[10px] font-black"
                          style={{ width: 22, height: 22, background: 'rgba(200,240,75,0.12)', color: '#C8F04B', border: '1px solid rgba(200,240,75,0.25)' }}>
                          {i + 1}
                        </span>
                        <p className="text-sm leading-relaxed pt-0.5" style={{ color: '#bbb' }}>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ height: 8 }} />
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
