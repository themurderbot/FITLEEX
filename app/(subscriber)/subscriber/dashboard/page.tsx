import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { getLocale }    from 'next-intl/server'
import Link             from 'next/link'
import { MessageCircle, ChevronRight, Bell } from 'lucide-react'

export const metadata = { title: 'Home — FITLEEX' }

const AV_COLORS = [
  'linear-gradient(135deg,#C8F04B,#7ab82e)',
  'linear-gradient(135deg,#60a5fa,#3b82f6)',
  'linear-gradient(135deg,#FF5A36,#cc3d20)',
  'linear-gradient(135deg,#a78bfa,#7c3aed)',
]

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function greeting(hour: number, locale: string) {
  if (locale === 'ar') {
    if (hour < 12) return 'صباح الخير'
    if (hour < 18) return 'مساء الخير'
    return 'مساء النور'
  }
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
}

export default async function SubscriberDashboard() {
  const supabase  = await createClient()
  const locale    = await getLocale()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  const [{ data: profile }, { data: subsRaw }, { data: recentSub }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    (supabase as any)
      .from('subscriptions')
      .select(`
        id, status, start_date, end_date,
        trainer_plans(name, duration_days),
        trainers!trainer_id(
          id,
          profiles!profile_id(full_name)
        ),
        workout_plans(id, week_number)
      `)
      .eq('subscriber_id', user.id)
      .in('status', ['active', 'expiring'])
      .order('start_date', { ascending: false }),
    (supabase as any)
      .from('progress_submissions')
      .select('id')
      .eq('subscriber_id', user.id)
      .gte('submitted_at', weekAgo)
      .limit(1)
      .maybeSingle(),
  ])

  const subs = (subsRaw ?? []) as any[]
  const hour = new Date().getHours()
  const firstName = (profile as any)?.full_name?.split(' ')[0] ?? ''

  const now       = Date.now()
  const totalDays = subs.reduce((s: number, sub: any) => s + (sub.trainer_plans?.duration_days ?? 30), 0)
  const daysIn    = subs.reduce((s: number, sub: any) => {
    if (!sub.start_date) return s
    return s + Math.max(0, Math.floor((now - new Date(sub.start_date).getTime()) / 86400000))
  }, 0)
  const completePct = totalDays > 0 ? Math.min(100, Math.round((daysIn / totalDays) * 100)) : 0

  const minDaysLeft = subs.reduce((min: number, sub: any) => {
    if (!sub.end_date) return min
    const d = Math.max(0, Math.ceil((new Date(sub.end_date).getTime() - now) / 86400000))
    return d < min ? d : min
  }, 999)

  const lbl = (en: string, ar: string) => locale === 'ar' ? ar : en

  const today = new Date().toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono mb-1" style={{ color: '#555' }}>{today}</p>
          <h1 className="text-2xl font-black text-white leading-tight">
            {greeting(hour, locale)} 👋
          </h1>
          <p className="text-xl font-black" style={{ color: '#C8F04B' }}>{firstName}!</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center justify-center rounded-xl"
            style={{ width: 40, height: 40, background: '#141414', border: '1px solid #222' }}>
            <Bell size={16} style={{ color: '#555' }} />
          </button>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg,#C8F04B,#7ab82e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 14, color: '#000',
          }}>
            {initials((profile as any)?.full_name ?? '?')}
          </div>
        </div>
      </div>

      {/* Hero card */}
      {subs.length > 0 && (
        <div className="rounded-2xl p-5" style={{
          background: 'linear-gradient(135deg, #1a2a0a 0%, #0f1a06 100%)',
          border: '1px solid rgba(200,240,75,0.2)',
        }}>
          <p className="text-[10px] font-mono tracking-[3px] uppercase mb-2" style={{ color: '#C8F04B' }}>
            {lbl(`Week ${Math.max(...subs.map((s: any) => s.workout_plans?.[0]?.week_number ?? 1))} of Training`, `الأسبوع ${Math.max(...subs.map((s: any) => s.workout_plans?.[0]?.week_number ?? 1))} من التدريب`)}
          </p>
          <p className="text-xl font-black text-white leading-tight">
            {lbl('KEEP PUSHING,', 'استمر في المجهود،')}
          </p>
          <p className="text-xl font-black text-white">{firstName.toUpperCase()}!</p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: 'rgba(200,240,75,0.15)', color: '#C8F04B' }}>
            🔥 {daysIn} {lbl('day streak', 'يوم متواصل')}
          </div>
        </div>
      )}

      {/* Stats row */}
      {subs.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: subs.length,                                          label: lbl('Trainers', 'مدربون'),    color: '#fff' },
            { value: minDaysLeft < 999 ? minDaysLeft : '—',               label: lbl('Days Left', 'أيام باقية'), color: '#FF8C42' },
            { value: `${completePct}%`,                                    label: lbl('Complete', 'منجز'),       color: '#C8F04B' },
          ].map((s, i) => (
            <div key={i} className="rounded-xl p-3 text-center"
              style={{ background: '#141414', border: '1px solid #222' }}>
              <p className="font-mono font-black text-2xl leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] mt-1.5 uppercase tracking-widest" style={{ color: '#555' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Active Subscriptions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-white">{lbl('Active Subscriptions', 'الاشتراكات النشطة')}</p>
          {subs.length > 0 && (
            <Link href="/subscriber/trainers" className="text-xs" style={{ color: '#C8F04B' }}>
              {lbl('See All', 'عرض الكل')}
            </Link>
          )}
        </div>

        {subs.length === 0 ? (
          <div className="rounded-2xl p-8 text-center flex flex-col items-center gap-4"
            style={{ background: '#141414', border: '1px solid #222' }}>
            <p className="text-4xl">🏋️</p>
            <p className="text-sm" style={{ color: '#555' }}>
              {lbl("You don't have a trainer yet", 'ليس لديك مدرب بعد')}
            </p>
            <Link href="/subscriber/trainers"
              className="px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
              style={{ background: '#C8F04B', color: '#000' }}>
              {lbl('Browse Trainers', 'تصفح المدربين')}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {subs.map((sub: any, idx: number) => {
              const trainer  = sub.trainers
              const tProfile = trainer?.profiles
              const plan     = sub.trainer_plans
              const daysLeft = sub.end_date
                ? Math.max(0, Math.ceil((new Date(sub.end_date).getTime() - now) / 86400000))
                : null
              const dur      = plan?.duration_days ?? 30
              const pct      = daysLeft !== null ? Math.max(5, Math.min(100, Math.round(((dur - daysLeft) / dur) * 100))) : 0
              const latestWP = (sub.workout_plans ?? []).sort((a: any, b: any) => b.week_number - a.week_number)[0]

              return (
                <div key={sub.id} className="rounded-2xl p-4"
                  style={{ background: '#141414', border: '1px solid #222' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: AV_COLORS[idx % AV_COLORS.length],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 900, fontSize: 15, color: '#000',
                    }}>
                      {initials(tProfile?.full_name ?? '?')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm">{tProfile?.full_name ?? '—'}</p>
                      <p className="text-[11px]" style={{ color: '#555' }}>
                        {plan?.name ?? '—'} · {dur} {lbl('days', 'يوم')}
                      </p>
                    </div>
                    <Link href={`/subscriber/chat?trainer=${trainer?.id}`}
                      className="flex items-center justify-center rounded-xl transition-colors hover:bg-white/10"
                      style={{ width: 36, height: 36, background: '#1e1e1e', border: '1px solid #2a2a2a' }}>
                      <MessageCircle size={15} style={{ color: '#888' }} />
                    </Link>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-mono" style={{ color: '#555' }}>
                      {pct}% {lbl('complete', 'منجز')}
                    </span>
                    {daysLeft !== null && (
                      <span className="text-[10px] font-bold" style={{ color: daysLeft <= 7 ? '#FF8C42' : '#C8F04B' }}>
                        {daysLeft} {lbl('days remaining', 'يوم باقي')}
                      </span>
                    )}
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: '#222' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: daysLeft !== null && daysLeft <= 7 ? '#FF8C42' : '#C8F04B', borderRadius: 2 }} />
                  </div>

                  {latestWP && (
                    <Link href={`/subscriber/plan/${latestWP.id}`}
                      className="mt-3 flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors hover:opacity-80"
                      style={{ background: 'rgba(200,240,75,0.08)', border: '1px solid rgba(200,240,75,0.15)' }}>
                      <span className="text-xs font-bold" style={{ color: '#C8F04B' }}>
                        📋 {lbl(`Week ${latestWP.week_number} Plan`, `خطة الأسبوع ${latestWP.week_number}`)}
                      </span>
                      <ChevronRight size={14} style={{ color: '#C8F04B' }} />
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Reminder — only if no submission in the last 7 days */}
      {subs.length > 0 && !recentSub && (
        <div>
          <p className="text-sm font-bold text-white mb-3">{lbl('Reminders', 'التذكيرات')}</p>
          <Link href="/subscriber/progress"
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-colors hover:opacity-80"
            style={{ background: '#141414', border: '1px solid rgba(200,240,75,0.2)' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11, background: 'rgba(200,240,75,0.1)',
              border: '1px solid rgba(200,240,75,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>
              📸
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{lbl('Submit weekly progress', 'أرسل تقرير الأسبوع')}</p>
              <p className="text-[11px]" style={{ color: '#555' }}>{lbl("Haven't submitted this week yet", 'لم ترسل تقريرك هذا الأسبوع بعد')}</p>
            </div>
            <ChevronRight size={16} style={{ color: '#C8F04B', marginLeft: 'auto' }} />
          </Link>
        </div>
      )}
    </div>
  )
}
