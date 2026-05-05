'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { X, Plus, Search, Trash2, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { revalidateSubscriberProfile } from './actions'

// ── Types ──────────────────────────────────────────────────────────────────

interface WorkoutExercise {
  name: string
  sets: number
  reps: string
  rest_seconds: number
  weight_kg: string
  order: number
  video_url?: string
}

interface VideoItem {
  id: string
  title: string
  title_ar?: string
  muscle_group: string
  url: string
}

interface WorkoutDay {
  dayNum: number
  dayName: string
  label: string
  exercises: WorkoutExercise[]
}

interface Meal {
  meal_type: string
  time: string
  name: string
  ingredients: string
  prep_steps: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  photo_urls: string[]
}

interface LibExercise {
  id: string
  name: string
  muscle: string
  equipment: string
  level: 'Beg' | 'Int' | 'Adv'
  desc: string
}

// ── Exercise library ───────────────────────────────────────────────────────

const LIB: LibExercise[] = [
  { id: 'bench-press',     name: 'Bench press',       muscle: 'chest',     equipment: 'barbell',    level: 'Int', desc: 'Classic compound push. Lower to chest, press up explosively.' },
  { id: 'incline-db',      name: 'Incline DB press',  muscle: 'chest',     equipment: 'dumbbell',   level: 'Beg', desc: 'Targets upper chest on an incline bench.' },
  { id: 'cable-flyes',     name: 'Cable flyes',       muscle: 'chest',     equipment: 'cable',      level: 'Beg', desc: 'Cable flyes for chest isolation and stretch.' },
  { id: 'push-ups',        name: 'Push-ups',          muscle: 'chest',     equipment: 'bodyweight', level: 'Beg', desc: 'Classic bodyweight chest exercise.' },
  { id: 'pull-ups',        name: 'Pull-ups',          muscle: 'back',      equipment: 'bodyweight', level: 'Int', desc: 'Compound pull for back width and biceps.' },
  { id: 'barbell-row',     name: 'Barbell row',       muscle: 'back',      equipment: 'barbell',    level: 'Int', desc: 'Bent-over row for back thickness.' },
  { id: 'lat-pulldown',    name: 'Lat pulldown',      muscle: 'back',      equipment: 'cable',      level: 'Beg', desc: 'Cable pulldown targeting the lats.' },
  { id: 'deadlift',        name: 'Deadlift',          muscle: 'back',      equipment: 'barbell',    level: 'Adv', desc: 'Full-body compound lift. Master form first.' },
  { id: 'squats',          name: 'Squats',            muscle: 'legs',      equipment: 'barbell',    level: 'Adv', desc: 'King of leg exercises. Full squat depth.' },
  { id: 'leg-press',       name: 'Leg press',         muscle: 'legs',      equipment: 'machine',    level: 'Beg', desc: 'Machine press for quad development.' },
  { id: 'leg-curl',        name: 'Leg curl',          muscle: 'legs',      equipment: 'machine',    level: 'Beg', desc: 'Machine hamstring curl.' },
  { id: 'lunges',          name: 'Lunges',            muscle: 'legs',      equipment: 'dumbbell',   level: 'Beg', desc: 'Unilateral leg strength and balance.' },
  { id: 'ohp',             name: 'OHP',               muscle: 'shoulders', equipment: 'barbell',    level: 'Int', desc: 'Overhead press for shoulder mass.' },
  { id: 'lateral-raises',  name: 'Lateral raises',    muscle: 'shoulders', equipment: 'dumbbell',   level: 'Beg', desc: 'Side raises for shoulder width.' },
  { id: 'face-pulls',      name: 'Face pulls',        muscle: 'shoulders', equipment: 'cable',      level: 'Beg', desc: 'Rear delt and rotator cuff exercise.' },
  { id: 'barbell-curl',    name: 'Barbell curl',      muscle: 'arms',      equipment: 'barbell',    level: 'Beg', desc: 'Classic curl for bicep mass.' },
  { id: 'hammer-curl',     name: 'Hammer curl',       muscle: 'arms',      equipment: 'dumbbell',   level: 'Beg', desc: 'Neutral grip curl for brachialis.' },
  { id: 'tricep-pushdown', name: 'Tricep pushdown',   muscle: 'arms',      equipment: 'cable',      level: 'Beg', desc: 'Cable pushdown for triceps isolation.' },
  { id: 'skull-crusher',   name: 'Skull crusher',     muscle: 'arms',      equipment: 'barbell',    level: 'Int', desc: 'EZ-bar crusher for triceps.' },
  { id: 'plank',           name: 'Plank',             muscle: 'core',      equipment: 'bodyweight', level: 'Beg', desc: 'Core stability and endurance exercise.' },
  { id: 'crunches',        name: 'Crunches',          muscle: 'core',      equipment: 'bodyweight', level: 'Beg', desc: 'Basic abdominal exercise.' },
]

const EQUIP_ICON: Record<string, { emoji: string; bg: string }> = {
  barbell:    { emoji: '🏋️', bg: 'rgba(255,107,53,0.18)'  },
  dumbbell:   { emoji: '💪', bg: 'rgba(255,140,66,0.18)'  },
  cable:      { emoji: '🔄', bg: 'rgba(77,158,255,0.18)'  },
  bodyweight: { emoji: '🤸', bg: 'rgba(76,175,80,0.18)'   },
  machine:    { emoji: '⚙️', bg: 'rgba(167,139,250,0.18)' },
}

function getExIcon(name: string) {
  const found = LIB.find(l => l.name.toLowerCase() === name.toLowerCase())
  return EQUIP_ICON[found?.equipment ?? ''] ?? { emoji: '🏃', bg: 'rgba(136,136,136,0.15)' }
}

const LEVEL_STYLE: Record<string, { bg: string; color: string }> = {
  Beg: { bg: 'rgba(76,175,80,0.15)',  color: '#4CAF50' },
  Int: { bg: 'rgba(255,140,66,0.15)', color: '#FF8C42' },
  Adv: { bg: 'rgba(255,77,77,0.15)',  color: '#FF4D4D' },
}

const MUSCLE_COLOR: Record<string, string> = {
  chest: '#FF6B35', back: '#4D9EFF', legs: '#C8F04B',
  shoulders: '#a78bfa', arms: '#4CAF50', core: '#fff',
}

const MEAL_TYPES = ['Breakfast', 'Morning Snack', 'Lunch', 'Afternoon Snack', 'Pre-workout', 'Dinner', 'Late Snack']

const EMPTY_MEAL: Meal = {
  meal_type: 'Breakfast', time: '08:00',
  name: '', ingredients: '', prep_steps: '',
  kcal: 0, protein: 0, carbs: 0, fat: 0, photo_urls: [],
}

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  subscriptionId: string
  subscriberId: string
  subscriberName: string
  planName: string
  trainerId: string
  workoutPlanId: string | null
  initialDays: WorkoutDay[]
  nutritionPlanId: string | null
  initialMeals: Meal[]
  initialTab: 'workout' | 'nutrition'
  availableVideos: VideoItem[]
}

// ── Component ──────────────────────────────────────────────────────────────

export function PlanBuilderClient({
  subscriptionId, subscriberId, subscriberName, planName, trainerId,
  workoutPlanId: initWPId, initialDays,
  nutritionPlanId: initNPId, initialMeals,
  initialTab, availableVideos,
}: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [view, setView]                     = useState<'workout' | 'nutrition'>(initialTab)
  const [days, setDays]                     = useState<WorkoutDay[]>(initialDays)
  const [meals, setMeals]                   = useState<Meal[]>(initialMeals)
  const [workoutPlanId, setWorkoutPlanId]   = useState<string | null>(initWPId)
  const [nutritionPlanId, setNutritionPlanId] = useState<string | null>(initNPId)
  const [saving, setSaving]                 = useState(false)
  const [toast, setToast]                   = useState('')
  const [saveErr, setSaveErr]               = useState('')

  // Exercise library modal
  const [addingToDay, setAddingToDay]       = useState<number | null>(null)
  const [libSearch, setLibSearch]           = useState('')
  const [libEquip, setLibEquip]             = useState('all')
  const [libSelected, setLibSelected]       = useState<LibExercise>(LIB[0])
  const [libTab, setLibTab]                 = useState<'library' | 'videos'>('library')
  const [selectedVideo, setSelectedVideo]   = useState<VideoItem | null>(null)
  const [exCfg, setExCfg]                   = useState({ sets: 3, reps: '12', rest: 60, kg: '' })
  const [exMode, setExMode]                 = useState<'simple' | 'custom'>('simple')
  const [customSets, setCustomSets]         = useState<{ reps: string; kg: string }[]>([])

  // Meal photos
  const mealPhotoRef = useRef<HTMLInputElement>(null)
  const [mealPhotoUploading, setMealPhotoUploading] = useState(false)

  async function handleMealPhoto(file: File) {
    setMealPhotoUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `${trainerId}/meal-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('meal-photos').upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from('meal-photos').getPublicUrl(path)
      setMealForm(f => ({ ...f, photo_urls: [...f.photo_urls, data.publicUrl] }))
    }
    setMealPhotoUploading(false)
  }

  function removeMealPhoto(idx: number) {
    setMealForm(f => ({ ...f, photo_urls: f.photo_urls.filter((_, i) => i !== idx) }))
  }

  // Copy template modal
  const [showCopyModal, setShowCopyModal]   = useState(false)
  const [copyPlans, setCopyPlans]           = useState<any[]>([])
  const [copyLoading, setCopyLoading]       = useState(false)

  // Meal modal
  const [mealModal, setMealModal]           = useState(false)
  const [editingMealIdx, setEditingMealIdx] = useState<number | null>(null)
  const [mealForm, setMealForm]             = useState<Meal>(EMPTY_MEAL)

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }
  function flashErr(msg: string) { setSaveErr(msg); setToast('') }

  // Day helpers
  function setDayLabel(idx: number, label: string) {
    setDays(ds => ds.map((d, i) => i === idx ? { ...d, label } : d))
  }
  function removeExercise(dayIdx: number, exIdx: number) {
    setDays(ds => ds.map((d, i) => i === dayIdx
      ? { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) }
      : d
    ))
  }
  function addExercise() {
    if (addingToDay === null) return
    const sets = exMode === 'custom' ? customSets.length : exCfg.sets
    const reps = exMode === 'custom' ? customSets.map(s => s.reps).join('/') : exCfg.reps
    const name = libTab === 'videos' && selectedVideo
      ? (selectedVideo.title_ar ?? selectedVideo.title)
      : libSelected.name
    const ex: WorkoutExercise = {
      name, sets, reps,
      rest_seconds: exCfg.rest, weight_kg: exCfg.kg, order: days[addingToDay].exercises.length,
      video_url: libTab === 'videos' ? selectedVideo?.url : undefined,
    }
    setDays(ds => ds.map((d, i) => i === addingToDay ? { ...d, exercises: [...d.exercises, ex] } : d))
    setAddingToDay(null)
    setLibTab('library')
    setSelectedVideo(null)
    setExMode('simple')
  }

  // Meal helpers
  function openNewMeal() { setMealForm(EMPTY_MEAL); setEditingMealIdx(null); setMealModal(true) }
  function openEditMeal(idx: number) { setMealForm({ ...meals[idx] }); setEditingMealIdx(idx); setMealModal(true) }
  function saveMeal() {
    if (editingMealIdx !== null) setMeals(ms => ms.map((m, i) => i === editingMealIdx ? mealForm : m))
    else setMeals(ms => [...ms, mealForm])
    setMealModal(false)
  }
  function deleteMeal(idx: number) { setMeals(ms => ms.filter((_, i) => i !== idx)) }

  // Copy template
  async function openCopyModal() {
    setShowCopyModal(true)
    setCopyLoading(true)
    const { data } = await supabase
      .from('subscriptions')
      .select('id, subscriber_id, profiles!subscriber_id(full_name), trainer_plans(name), workout_plans(id, workout_days(id, day_number, label, exercises(id, name, sets, reps, rest_seconds, sort_order)))')
      .eq('trainer_id', trainerId)
      .neq('id', subscriptionId)
    setCopyPlans((data ?? []) as any[])
    setCopyLoading(false)
  }

  function copyFromPlan(sub: any) {
    const wp      = Array.isArray(sub.workout_plans) ? sub.workout_plans[0] : sub.workout_plans
    const dbDays  = (wp?.workout_days ?? []) as any[]
    setDays(prev => prev.map((d, i) => {
      const dbDay = dbDays.find((dd: any) => dd.day_number === i + 1)
      return {
        ...d,
        label: dbDay?.label ?? 'Rest',
        exercises: dbDay
          ? ((dbDay.exercises ?? []) as any[])
              .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .map((e: any) => ({
                name: e.name, sets: e.sets ?? 3, reps: String(e.reps ?? '12'),
                rest_seconds: e.rest_seconds ?? 60, weight_kg: '', order: e.sort_order ?? 0,
              }))
          : [],
      }
    }))
    setShowCopyModal(false)
    flash('Plan copied! You can still edit it.')
  }

  // Save to Supabase
  async function savePlan() {
    setSaving(true)
    try {
      let wpId = workoutPlanId
      if (!wpId) {
        const { data, error } = await (supabase.from('workout_plans') as any).insert({
          subscription_id: subscriptionId, trainer_id: trainerId, week_number: 1,
        }).select('id').single()
        if (error) throw new Error(`workout_plans: ${error.message}`)
        wpId = data?.id ?? null
        if (wpId) setWorkoutPlanId(wpId)
      }
      if (wpId) {
        await supabase.from('workout_days').delete().eq('workout_plan_id', wpId)
        for (const day of days) {
          if (day.exercises.length === 0 && day.label === 'Rest') continue
          const { data: nd, error: dayErr } = await (supabase.from('workout_days') as any).insert({
            workout_plan_id: wpId, day_number: day.dayNum, label: day.label,
          }).select('id').single()
          if (dayErr) throw new Error(`workout_days: ${dayErr.message}`)
          if (nd?.id && day.exercises.length > 0) {
            const { error: exErr } = await (supabase.from('exercises') as any).insert(
              day.exercises.map((ex, i) => ({
                workout_day_id: nd.id, name: ex.name,
                sets: ex.sets, reps: ex.reps, rest_seconds: ex.rest_seconds, sort_order: i,
                video_url: ex.video_url ?? null,
              }))
            )
            if (exErr) throw new Error(`exercises: ${exErr.message}`)
          }
        }
      }

      let npId = nutritionPlanId
      if (!npId) {
        // Check if one already exists (handles duplicate plans from previous saves)
        const { data: existing } = await (supabase.from('nutrition_plans') as any)
          .select('id')
          .eq('subscription_id', subscriptionId)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()
        if (existing?.id) {
          npId = existing.id
          setNutritionPlanId(npId)
        } else {
          const { data, error } = await (supabase.from('nutrition_plans') as any).insert({
            subscription_id: subscriptionId, trainer_id: trainerId,
          }).select('id').single()
          if (error) throw new Error(`nutrition_plans: ${error.message}`)
          npId = data?.id ?? null
          if (npId) setNutritionPlanId(npId)
        }
      }
      if (npId) {
        await supabase.from('meals').delete().eq('nutrition_plan_id', npId)
        if (meals.length > 0) {
          const { error: mealErr } = await (supabase.from('meals') as any).insert(
            meals.map((m, i) => ({
              nutrition_plan_id: npId, meal_time: m.time, name: m.name,
              ingredients: m.ingredients || null, preparation_steps: m.prep_steps || null,
              kcal: m.kcal, protein_g: m.protein, carbs_g: m.carbs, fat_g: m.fat,
              photo_urls: m.photo_urls ?? [], sort_order: i,
            }))
          )
          if (mealErr) throw new Error(`meals: ${mealErr.message}`)
        }
      }
      await revalidateSubscriberProfile(subscriberId)
      flash('Plan saved!')
    } catch (err: any) {
      console.error('savePlan error:', err)
      flashErr(err?.message ?? 'Unknown error — check console')
    } finally {
      setSaving(false)
    }
  }

  const filteredLib = LIB.filter(ex => {
    const q = libSearch.toLowerCase()
    return (!q || ex.name.toLowerCase().includes(q) || ex.muscle.includes(q))
      && (libEquip === 'all' || ex.equipment === libEquip)
  })

  const sortedMeals = [...meals].sort((a, b) => a.time.localeCompare(b.time))
  const totalKcal    = meals.reduce((s, m) => s + m.kcal, 0)
  const totalProtein = meals.reduce((s, m) => s + m.protein, 0)
  const totalCarbs   = meals.reduce((s, m) => s + m.carbs, 0)
  const totalFat     = meals.reduce((s, m) => s + m.fat, 0)

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Plan Builder</h1>
          <p className="text-sm mt-0.5" style={{ color: '#555' }}>{subscriberName} · {planName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/trainer/subscribers/${subscriberId}`}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888' }}>
            ← Back to Profile
          </Link>
          <button type="button"
            onClick={openCopyModal}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888' }}>
            📋 Copy Template
          </button>
          <button type="button" onClick={savePlan} disabled={saving}
            className="text-xs px-4 py-2 rounded-lg font-bold transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: '#C8F04B', color: '#000' }}>
            {saving ? 'Saving...' : 'Save Plan'}
          </button>
        </div>
      </div>

      {/* ── Save error ── */}
      {saveErr && (
        <div className="flex items-start gap-3 rounded-xl px-4 py-3"
          style={{ background: 'rgba(255,77,77,0.12)', border: '1px solid rgba(255,77,77,0.4)' }}>
          <span style={{ color: '#FF4D4D', fontSize: 16, flexShrink: 0 }}>✕</span>
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: '#FF4D4D' }}>Save failed</p>
            <p className="text-xs mt-0.5 font-mono break-all" style={{ color: '#ff8080' }}>{saveErr}</p>
          </div>
          <button onClick={() => setSaveErr('')} style={{ color: '#FF4D4D', flexShrink: 0 }}>✕</button>
        </div>
      )}

      {/* ── View toggle ── */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: '#161616', border: '1px solid #222', width: 'fit-content' }}>
        {([{ k: 'workout', icon: '💪', label: 'Workout' }, { k: 'nutrition', icon: '🥗', label: 'Nutrition' }] as const).map(v => (
          <button key={v.k}
            onClick={() => setView(v.k)}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors"
            style={view === v.k ? { background: '#C8F04B', color: '#000' } : { color: '#666' }}>
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {/* ── WORKOUT GRID ── */}
      {view === 'workout' && (
        <div className="overflow-x-auto pb-4">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(185px, 1fr))', gap: 12, minWidth: 1300 }}>
            {days.map((day, dayIdx) => {
              const mc = MUSCLE_COLOR[day.label.toLowerCase()] ?? '#888'
              return (
                <div key={day.dayNum} className="rounded-xl flex flex-col"
                  style={{ background: '#141414', border: '1px solid #222', minHeight: 320 }}>
                  {/* Column header */}
                  <div className="px-3 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid #222' }}>
                    <span className="font-mono font-black text-xs text-white">{day.dayName}</span>
                    <input
                      value={day.label}
                      onChange={e => setDayLabel(dayIdx, e.target.value)}
                      className="text-right text-[11px] font-bold font-mono bg-transparent border-none outline-none"
                      style={{ color: mc, maxWidth: 90 }}
                      placeholder="Rest"
                    />
                  </div>

                  {/* Exercise cards */}
                  <div className="flex-1 p-2 flex flex-col gap-1.5 overflow-y-auto">
                    {day.exercises.length === 0 && (
                      <div className="flex-1 flex items-center justify-center text-xs py-6"
                        style={{ color: '#2a2a2a' }}>
                        Rest Day 😴
                      </div>
                    )}
                    {day.exercises.map((ex, exIdx) => {
                      const icon = getExIcon(ex.name)
                      return (
                        <div key={exIdx} className="rounded-lg px-2.5 py-2 flex items-center gap-2 group"
                          style={{ background: '#1a1a1a', border: '1px solid #222' }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                            background: icon.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                          }}>
                            {icon.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{ex.name}</p>
                            <p className="text-[10px] font-mono mt-0.5" style={{ color: '#555' }}>
                              {ex.sets}×{ex.reps} · {ex.rest_seconds}s
                            </p>
                          </div>
                          <button onClick={() => removeExercise(dayIdx, exIdx)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:text-red-400"
                            style={{ color: '#555' }}>
                            <X size={12} />
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {/* Add exercise */}
                  <button
                    onClick={() => { setAddingToDay(dayIdx); setLibSelected(LIB[0]); setExCfg({ sets: 3, reps: '12', rest: 60, kg: '' }) }}
                    className="mx-2 mb-2 flex items-center justify-center gap-1 rounded-lg py-2 text-xs transition-colors hover:bg-white/5"
                    style={{ border: '1px dashed #2a2a2a', color: '#444' }}>
                    <Plus size={12} /> Add Exercise
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── NUTRITION ── */}
      {view === 'nutrition' && (
        <div style={{ maxWidth: 740 }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-mono tracking-[3px] uppercase" style={{ color: '#555' }}>Daily Meal Schedule</p>
              <button onClick={openNewMeal}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition-opacity hover:opacity-80"
                style={{ background: '#C8F04B', color: '#000' }}>
                <Plus size={13} /> Add Meal
              </button>
            </div>

            {sortedMeals.length === 0 && (
              <div className="rounded-xl py-14 text-center text-sm" style={{ background: '#141414', border: '1px solid #222', color: '#555' }}>
                No meals yet. Click + Add Meal.
              </div>
            )}

            <div className="flex flex-col gap-3">
              {sortedMeals.map((meal, idx) => {
                const realIdx = meals.indexOf(meal)
                return (
                  <div key={idx} className="rounded-xl flex items-center gap-4 px-4 py-3.5"
                    style={{ background: '#141414', border: '1px solid #222' }}>
                    <div className="shrink-0" style={{ minWidth: 56 }}>
                      <p className="font-mono font-black text-lg leading-none" style={{ color: '#C8F04B' }}>{meal.time}</p>
                      <p className="text-[9px] tracking-widest uppercase mt-0.5" style={{ color: '#555' }}>{meal.meal_type || 'MEAL'}</p>
                    </div>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      🍽️
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{meal.name || '—'}</p>
                      {meal.ingredients && <p className="text-[11px] truncate mt-0.5" style={{ color: '#666' }}>{meal.ingredients}</p>}
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {meal.kcal    > 0 && <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold" style={{ background: 'rgba(200,240,75,0.12)', color: '#C8F04B' }}>{meal.kcal} kcal</span>}
                        {meal.protein > 0 && <span className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(77,158,255,0.12)', color: '#4D9EFF' }}>{meal.protein}g protein</span>}
                        {meal.carbs   > 0 && <span className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(255,140,66,0.12)', color: '#FF8C42' }}>{meal.carbs}g carbs</span>}
                        {meal.fat     > 0 && <span className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(136,136,136,0.12)', color: '#888' }}>{meal.fat}g fat</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button onClick={() => openEditMeal(realIdx)}
                        className="flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
                        style={{ width: 30, height: 30, background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#888' }}>
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => deleteMeal(realIdx)}
                        className="flex items-center justify-center rounded-lg transition-colors hover:bg-red-500/10"
                        style={{ width: 30, height: 30, background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#555' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Daily Totals */}
            {meals.length > 0 && (
              <div className="rounded-xl mt-4" style={{ background: '#141414', border: '1px solid #222' }}>
                <div className="px-4 py-3" style={{ borderBottom: '1px solid #222' }}>
                  <p className="text-xs font-semibold text-white">Daily Totals</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
                  {[
                    { label: 'KCAL',    value: totalKcal,    color: '#C8F04B' },
                    { label: 'PROTEIN', value: `${totalProtein}g`, color: '#fff' },
                    { label: 'CARBS',   value: `${totalCarbs}g`,   color: '#fff' },
                    { label: 'FAT',     value: `${totalFat}g`,     color: '#fff' },
                  ].map((s, i, arr) => (
                    <div key={s.label} style={{
                      textAlign: 'center', padding: '14px 8px',
                      borderRight: i < arr.length - 1 ? '1px solid #222' : undefined,
                    }}>
                      <p className="font-mono font-bold text-lg" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-[9px] tracking-[2px]" style={{ color: '#555' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
              <span className="text-xs shrink-0">ℹ️</span>
              <p className="text-[11px]" style={{ color: '#555' }}>
                This schedule repeats daily. The subscriber checks off each meal. Changes apply from the next day.
              </p>
            </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-bold"
          style={{ background: '#C8F04B', color: '#000', boxShadow: '0 4px 24px rgba(0,0,0,0.6)' }}>
          {toast}
        </div>
      )}

      {/* ── Exercise Library Modal ── */}
      {addingToDay !== null && (
        <>
          <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setAddingToDay(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="rounded-2xl w-full flex flex-col overflow-hidden"
              style={{ maxWidth: 980, maxHeight: '90vh', background: '#161616', border: '1px solid #2a2a2a' }}>
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #222' }}>
                <div>
                  <h2 className="font-bold text-white text-base">Exercise Library</h2>
                  <p className="text-xs mt-0.5" style={{ color: '#555' }}>Adding to {days[addingToDay].dayName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
                    {(['library', 'videos'] as const).map(tab => (
                      <button key={tab} onClick={() => setLibTab(tab)}
                        className="px-3 py-1.5 text-xs font-bold transition-colors"
                        style={libTab === tab ? { background: '#C8F04B', color: '#000' } : { background: '#1a1a1a', color: '#666' }}>
                        {tab === 'library' ? '📋 Library' : '🎬 Videos'}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setAddingToDay(null)} className="hover:text-white transition-colors" style={{ color: '#555' }}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex flex-1 overflow-hidden min-h-0">
                {/* Left: list */}
                <div className="flex flex-col shrink-0 overflow-hidden" style={{ width: 380, borderRight: '1px solid #222' }}>
                  {/* Search + filter */}
                  <div className="p-3 flex flex-col gap-2 shrink-0" style={{ borderBottom: '1px solid #222' }}>
                    <div className="relative">
                      <Search size={12} className="absolute top-1/2 -translate-y-1/2" style={{ left: 10, color: '#555' }} />
                      <input value={libSearch} onChange={e => setLibSearch(e.target.value)}
                        className="input w-full text-xs" style={{ paddingLeft: 30 }}
                        placeholder="Search..." />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {['all', 'barbell', 'dumbbell', 'cable', 'bodyweight', 'machine'].map(eq => (
                        <button key={eq} onClick={() => setLibEquip(eq)}
                          className="px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize transition-colors"
                          style={libEquip === eq
                            ? { background: '#C8F04B', color: '#000' }
                            : { background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#666' }}>
                          {eq === 'all' ? 'All' : eq.charAt(0).toUpperCase() + eq.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Exercise / Video list */}
                  <div className="flex-1 overflow-y-auto">
                    {libTab === 'library' ? filteredLib.map(ex => {
                      const lv  = LEVEL_STYLE[ex.level]
                      const sel = libSelected.id === ex.id
                      return (
                        <button key={ex.id} onClick={() => setLibSelected(ex)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-start transition-colors hover:bg-white/[0.02]"
                          style={{
                            borderBottom: '1px solid #1e1e1e',
                            background:   sel ? 'rgba(200,240,75,0.04)' : 'transparent',
                            borderLeft:   sel ? '3px solid #C8F04B' : '3px solid transparent',
                          }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                            💪
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{ex.name}</p>
                            <p className="text-[10px] font-mono capitalize" style={{ color: '#555' }}>{ex.muscle} · {ex.equipment}</p>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0"
                            style={{ background: lv.bg, color: lv.color }}>{ex.level}</span>
                        </button>
                      )
                    }) : availableVideos.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: '#444' }}>
                        <span style={{ fontSize: 32 }}>🎬</span>
                        <p className="text-xs">No videos uploaded yet</p>
                      </div>
                    ) : availableVideos.filter(v =>
                      !libSearch || v.title.toLowerCase().includes(libSearch.toLowerCase()) || v.title_ar?.includes(libSearch)
                    ).map(v => {
                      const sel = selectedVideo?.id === v.id
                      return (
                        <button key={v.id} onClick={() => setSelectedVideo(v)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-start transition-colors hover:bg-white/[0.02]"
                          style={{
                            borderBottom: '1px solid #1e1e1e',
                            background:   sel ? 'rgba(200,240,75,0.04)' : 'transparent',
                            borderLeft:   sel ? '3px solid #C8F04B' : '3px solid transparent',
                          }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                            🎬
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{v.title_ar ?? v.title}</p>
                            <p className="text-[10px] font-mono capitalize" style={{ color: '#555' }}>{v.muscle_group}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Right: detail + config */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-lg font-bold text-white">
                        {libTab === 'videos' && selectedVideo
                          ? (selectedVideo.title_ar ?? selectedVideo.title)
                          : libSelected.name}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded capitalize"
                        style={{ background: 'rgba(200,240,75,0.1)', color: '#C8F04B', border: '1px solid rgba(200,240,75,0.2)' }}>
                        {libTab === 'videos' && selectedVideo ? selectedVideo.muscle_group : libSelected.muscle}
                      </span>
                      {libTab === 'library' && (
                        <span className="text-[10px] px-2 py-0.5 rounded capitalize"
                          style={{ background: '#1e1e1e', color: '#666', border: '1px solid #2a2a2a' }}>
                          {libSelected.equipment}
                        </span>
                      )}
                    </div>
                    {libTab === 'library' && (
                      <p className="text-sm leading-relaxed" style={{ color: '#888' }}>{libSelected.desc}</p>
                    )}
                    {libTab === 'videos' && !selectedVideo && (
                      <p className="text-sm" style={{ color: '#555' }}>اختر فيديو من القائمة لمعاينته</p>
                    )}
                  </div>

                  {/* Video preview */}
                  {libTab === 'videos' && selectedVideo ? (
                    <video src={selectedVideo.url} controls preload="metadata" muted
                      className="w-full rounded-xl" style={{ maxHeight: 190, background: '#000' }} />
                  ) : (
                    <div className="rounded-xl flex flex-col items-center justify-center"
                      style={{ height: 190, background: '#111', border: '1px solid #222', color: '#333' }}>
                      <span style={{ fontSize: 36 }}>▶</span>
                      <p className="text-xs mt-2">{libSelected.name} — proper form</p>
                    </div>
                  )}

                  {/* Sets config */}
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[3px] mb-3" style={{ color: '#555' }}>Sets Configuration</p>
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => setExMode('simple')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        style={exMode === 'simple' ? { background: '#C8F04B', color: '#000' } : { background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#666' }}>
                        Simple
                      </button>
                      <button
                        onClick={() => {
                          setExMode('custom')
                          setCustomSets(Array.from({ length: exCfg.sets }, () => ({ reps: exCfg.reps, kg: exCfg.kg })))
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        style={exMode === 'custom' ? { background: '#C8F04B', color: '#000' } : { background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#666' }}>
                        Custom per set
                      </button>
                    </div>

                    {exMode === 'simple' ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                        {([
                          { label: 'Sets',    key: 'sets', type: 'number' },
                          { label: 'Reps',    key: 'reps', type: 'text'   },
                          { label: 'Rest (s)',key: 'rest', type: 'number' },
                          { label: 'kg',      key: 'kg',   type: 'text'   },
                        ] as const).map(f => (
                          <div key={f.key} className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-mono" style={{ color: '#555' }}>{f.label}</label>
                            <input type={f.type}
                              value={(exCfg as any)[f.key]}
                              placeholder={f.key === 'kg' ? '—' : undefined}
                              onChange={e => {
                                const val = f.type === 'number' ? Number(e.target.value) : e.target.value
                                setExCfg(c => ({ ...c, [f.key]: val }))
                                if (f.key === 'sets') {
                                  setCustomSets(Array.from({ length: Number(e.target.value) || 1 }, (_, i) => customSets[i] ?? { reps: exCfg.reps, kg: exCfg.kg }))
                                }
                              }}
                              className="input text-center font-mono text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr', gap: 8, marginBottom: 4 }}>
                          <p className="text-[10px] font-mono text-center" style={{ color: '#555' }}>SET</p>
                          <p className="text-[10px] font-mono text-center" style={{ color: '#555' }}>REPS</p>
                          <p className="text-[10px] font-mono text-center" style={{ color: '#555' }}>KG</p>
                          <p className="text-[10px] font-mono text-center" style={{ color: '#555' }}>REST (s)</p>
                        </div>
                        {customSets.map((s, i) => (
                          <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr', gap: 8, alignItems: 'center' }}>
                            <div className="flex items-center justify-center rounded-lg text-xs font-mono font-bold"
                              style={{ height: 36, background: '#1e1e1e', color: '#C8F04B' }}>{i + 1}</div>
                            <input type="text" className="input text-center font-mono text-sm" value={s.reps}
                              onChange={e => setCustomSets(cs => cs.map((x, j) => j === i ? { ...x, reps: e.target.value } : x))} />
                            <input type="text" className="input text-center font-mono text-sm" placeholder="—" value={s.kg}
                              onChange={e => setCustomSets(cs => cs.map((x, j) => j === i ? { ...x, kg: e.target.value } : x))} />
                            <input type="number" className="input text-center font-mono text-sm" value={exCfg.rest}
                              onChange={e => setExCfg(c => ({ ...c, rest: Number(e.target.value) }))} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Voice note */}
                  <div>
                    <p className="text-[11px] font-mono mb-2" style={{ color: '#555' }}>Voice Note (optional · 30s)</p>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-white/5"
                      style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#888' }}>
                      🎙 Record note
                    </button>
                  </div>

                  {/* Add to plan */}
                  <button onClick={addExercise}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-80"
                    style={{ background: '#C8F04B', color: '#000' }}>
                    + Add to plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Edit Meal Modal ── */}
      {mealModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setMealModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="rounded-2xl w-full overflow-y-auto"
              style={{ maxWidth: 640, maxHeight: '92vh', background: '#161616', border: '1px solid #2a2a2a' }}>
              <div className="flex items-center justify-between px-6 py-4 sticky top-0" style={{ borderBottom: '1px solid #222', background: '#161616' }}>
                <h2 className="font-bold text-white">{editingMealIdx !== null ? 'Edit Meal' : 'Add Meal'}</h2>
                <button onClick={() => setMealModal(false)} className="hover:text-white transition-colors" style={{ color: '#555' }}>
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-4">
                {/* Type + Time */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono" style={{ color: '#555' }}>Meal type</label>
                    <select className="input" value={mealForm.meal_type}
                      onChange={e => setMealForm(f => ({ ...f, meal_type: e.target.value }))}>
                      {MEAL_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono" style={{ color: '#555' }}>Time</label>
                    <input type="time" className="input" value={mealForm.time}
                      onChange={e => setMealForm(f => ({ ...f, time: e.target.value }))} />
                  </div>
                </div>

                {/* Meal name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono" style={{ color: '#555' }}>Meal name</label>
                  <input className="input" placeholder="e.g. High Protein Breakfast"
                    value={mealForm.name} onChange={e => setMealForm(f => ({ ...f, name: e.target.value }))} />
                </div>

                {/* Ingredients */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono" style={{ color: '#555' }}>Ingredients</label>
                  <textarea className="input resize-none" style={{ height: 70 }}
                    placeholder="4 eggs · brown bread · avocado · milk"
                    value={mealForm.ingredients} onChange={e => setMealForm(f => ({ ...f, ingredients: e.target.value }))} />
                </div>

                {/* Prep steps */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono" style={{ color: '#555' }}>Preparation steps (optional)</label>
                  <textarea className="input resize-none" style={{ height: 88 }}
                    placeholder={'1. Boil eggs\n2. Toast bread\n3. Slice avocado'}
                    value={mealForm.prep_steps} onChange={e => setMealForm(f => ({ ...f, prep_steps: e.target.value }))} />
                </div>

                {/* Photos */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono" style={{ color: '#555' }}>Meal photos (optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {mealForm.photo_urls.map((url, i) => (
                      <div key={i} className="relative shrink-0"
                        style={{ width: 72, height: 72 }}>
                        <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                        <button type="button" onClick={() => removeMealPhoto(i)}
                          className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full text-xs font-bold"
                          style={{ width: 18, height: 18, background: '#FF4D4D', color: '#fff' }}>
                          ✕
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => mealPhotoRef.current?.click()}
                      className="shrink-0 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors hover:bg-white/5"
                      style={{ width: 72, height: 72, background: '#1a1a1a', border: '2px dashed #2a2a2a' }}>
                      {mealPhotoUploading
                        ? <span className="text-xs" style={{ color: '#C8F04B' }}>⏳</span>
                        : <>
                            <span style={{ fontSize: 18 }}>📷</span>
                            <span className="text-[10px]" style={{ color: '#555' }}>Add</span>
                          </>
                      }
                    </button>
                  </div>
                  <input ref={mealPhotoRef} type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && handleMealPhoto(e.target.files[0])} />
                </div>

                {/* Macros */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                  {([
                    { label: 'kcal', key: 'kcal' },
                    { label: 'Protein (g)', key: 'protein' },
                    { label: 'Carbs (g)',   key: 'carbs' },
                    { label: 'Fat (g)',     key: 'fat' },
                  ] as const).map(f => (
                    <div key={f.key} className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-mono" style={{ color: '#555' }}>{f.label}</label>
                      <input type="number" min="0" className="input text-center font-mono"
                        value={(mealForm as any)[f.key] || ''}
                        onChange={e => setMealForm(fm => ({ ...fm, [f.key]: Number(e.target.value) }))} />
                    </div>
                  ))}
                </div>

                {/* Save */}
                <button onClick={saveMeal} disabled={!mealForm.name.trim()}
                  className="w-full py-3 rounded-xl font-bold text-sm mt-1 transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: '#C8F04B', color: '#000' }}>
                  Save Meal
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Copy Template Modal ── */}
      {showCopyModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setShowCopyModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="rounded-2xl w-full overflow-hidden flex flex-col"
              style={{ maxWidth: 480, maxHeight: '80vh', background: '#161616', border: '1px solid #2a2a2a' }}>
              <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid #222' }}>
                <div>
                  <h2 className="font-bold text-white">Copy Plan From</h2>
                  <p className="text-xs mt-0.5" style={{ color: '#555' }}>Copies the workout structure only. You can still edit after.</p>
                </div>
                <button onClick={() => setShowCopyModal(false)} className="hover:text-white transition-colors" style={{ color: '#555' }}>
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {copyLoading ? (
                  <div className="py-12 text-center text-sm" style={{ color: '#555' }}>Loading...</div>
                ) : copyPlans.length === 0 ? (
                  <div className="py-12 text-center text-sm" style={{ color: '#555' }}>No other subscriber plans found</div>
                ) : (
                  copyPlans.map((sub: any, idx) => {
                    const name = (sub.profiles as any)?.full_name ?? '—'
                    const plan = (sub.trainer_plans as any)?.name ?? '—'
                    const wp   = Array.isArray(sub.workout_plans) ? sub.workout_plans[0] : sub.workout_plans
                    const daysCount = (wp?.workout_days ?? []).filter((d: any) => (d.exercises ?? []).length > 0).length
                    const initials  = name.trim().split(/\s+/).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
                    const AV = ['linear-gradient(135deg,#C8F04B,#7ab82e)','linear-gradient(135deg,#60a5fa,#3b82f6)','linear-gradient(135deg,#a78bfa,#7c3aed)','linear-gradient(135deg,#f59e0b,#d97706)','linear-gradient(135deg,#FF5A36,#cc3d20)']
                    return (
                      <button key={sub.id} onClick={() => copyFromPlan(sub)}
                        className="w-full flex items-center gap-3 px-5 py-4 text-start transition-colors hover:bg-white/[0.03]"
                        style={{ borderBottom: '1px solid #1e1e1e' }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                          background: AV[idx % AV.length],
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: 13, color: '#000',
                        }}>{initials}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">{name}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: '#555' }}>{plan} · {daysCount} days</p>
                        </div>
                        <span style={{ color: '#C8F04B', fontSize: 18 }}>→</span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
