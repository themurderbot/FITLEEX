import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { getLocale }    from 'next-intl/server'
import Link             from 'next/link'
import { ChevronRight, Dumbbell } from 'lucide-react'

export const metadata = { title: 'My Plans — FITLEEX' }

export default async function SubscriberPlanIndexPage() {
  const supabase = await createClient()
  const locale   = await getLocale()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get active subscriptions with their workout plans
  const { data: subsRaw } = await (supabase as any)
    .from('subscriptions')
    .select(`
      id, trainer_id,
      trainers!trainer_id(id, profiles!profile_id(full_name)),
      workout_plans(id, week_number, created_at)
    `)
    .eq('subscriber_id', user.id)
    .in('status', ['active', 'expiring'])

  const subs = (subsRaw ?? []) as any[]

  // Flatten all plans across subscriptions, newest first
  const plans = subs.flatMap((sub: any) =>
    (sub.workout_plans ?? []).map((wp: any) => ({
      id:          wp.id,
      weekNumber:  wp.week_number,
      createdAt:   wp.created_at,
      trainerName: sub.trainers?.profiles?.full_name ?? '—',
    }))
  ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const lbl = (en: string, ar: string) => locale === 'ar' ? ar : en

  // If exactly one plan, redirect directly
  if (plans.length === 1) redirect(`/subscriber/plan/${plans[0].id}`)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-black text-white">{lbl('MY PLANS', 'خططي')}</h1>
        <p className="text-xs mt-0.5" style={{ color: '#555' }}>{lbl('Weekly workout plans', 'خطط التدريب الأسبوعية')}</p>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-2xl py-16 text-center flex flex-col items-center gap-4"
          style={{ background: '#141414', border: '1px solid #222' }}>
          <Dumbbell size={40} style={{ color: '#333' }} />
          <p className="text-sm" style={{ color: '#555' }}>
            {lbl('No workout plans yet', 'لا توجد خطط تدريب بعد')}
          </p>
          <p className="text-xs px-6" style={{ color: '#444' }}>
            {lbl('Your trainer will assign a plan once you subscribe', 'سيضع مدربك خطة بعد اشتراكك')}
          </p>
          <Link href="/subscriber/trainers"
            className="px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
            style={{ background: '#C8F04B', color: '#000' }}>
            {lbl('Browse Trainers', 'تصفح المدربين')}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {plans.map((plan: any, idx: number) => (
            <Link key={plan.id} href={`/subscriber/plan/${plan.id}`}
              className="flex items-center gap-4 rounded-2xl p-4 transition-opacity hover:opacity-80"
              style={{ background: '#141414', border: '1px solid #222' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: idx === 0 ? 'rgba(200,240,75,0.15)' : 'rgba(255,255,255,0.05)',
                border: idx === 0 ? '1px solid rgba(200,240,75,0.3)' : '1px solid #2a2a2a',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>
                📋
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white text-sm">
                    {lbl(`Week ${plan.weekNumber} Plan`, `خطة الأسبوع ${plan.weekNumber}`)}
                  </p>
                  {idx === 0 && (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                      style={{ background: '#C8F04B', color: '#000' }}>
                      {lbl('LATEST', 'الأحدث')}
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: '#666' }}>{plan.trainerName}</p>
              </div>
              <ChevronRight size={18} style={{ color: '#444' }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
