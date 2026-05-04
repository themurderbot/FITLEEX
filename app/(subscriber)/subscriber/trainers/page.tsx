import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { getLocale }    from 'next-intl/server'
import Link             from 'next/link'
import { Search, Star } from 'lucide-react'

export const metadata = { title: 'Trainers — FITLEEX' }

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const BANNER_COLORS = [
  'linear-gradient(135deg,#1a3a06 0%,#2d5c0a 100%)',
  'linear-gradient(135deg,#0a1f3a 0%,#0d3060 100%)',
  'linear-gradient(135deg,#3a0a0a 0%,#5c1010 100%)',
  'linear-gradient(135deg,#1a0a3a 0%,#2d1060 100%)',
  'linear-gradient(135deg,#3a2a00 0%,#5c4400 100%)',
]

const AV_COLORS = [
  'linear-gradient(135deg,#C8F04B,#7ab82e)',
  'linear-gradient(135deg,#60a5fa,#3b82f6)',
  'linear-gradient(135deg,#FF5A36,#cc3d20)',
  'linear-gradient(135deg,#a78bfa,#7c3aed)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
]

interface PageProps { searchParams: Promise<{ q?: string; filter?: string }> }

export default async function TrainersPage({ searchParams }: PageProps) {
  const { q, filter } = await searchParams
  const supabase = await createClient()
  const locale   = await getLocale()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  let query = (supabase as any)
    .from('trainers')
    .select('id, specialty, bio, years_experience, rating, rating_count, subscribers_count, profiles!profile_id(full_name, avatar_url), trainer_plans(id, price, currency, duration_days, active)')
    .eq('approval_status', 'approved')

  if (filter === 'top') query = query.order('rating', { ascending: false })
  else if (filter === 'low') query = query.order('id') // plans sorted client-side by price
  else query = query.order('subscribers_count', { ascending: false })

  const { data: trainersRaw } = await query

  const trainers = (trainersRaw ?? []) as any[]

  const { data: mySubs } = await (supabase as any)
    .from('subscriptions')
    .select('trainer_id')
    .eq('subscriber_id', user.id)
    .in('status', ['active', 'expiring'])

  const myTrainerIds = new Set((mySubs ?? []).map((s: any) => s.trainer_id))

  const filtered = trainers.filter(t => {
    if (!q) return true
    const name = t.profiles?.full_name?.toLowerCase() ?? ''
    const spec = t.specialty?.toLowerCase() ?? ''
    return name.includes(q.toLowerCase()) || spec.includes(q.toLowerCase())
  })

  const lbl = (en: string, ar: string) => locale === 'ar' ? ar : en

  const chips = [
    { key: '',    labelEn: 'All',        labelAr: 'الكل',       emoji: '' },
    { key: 'top', labelEn: 'Top Rated',  labelAr: 'الأعلى تقييماً', emoji: '★ ' },
    { key: 'low', labelEn: 'Low Price',  labelAr: 'أقل سعراً',  emoji: '💰 ' },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-black text-white">{lbl('TRAINERS', 'المدربون')}</h1>
        <p className="text-xs mt-0.5" style={{ color: '#555' }}>{lbl('Find your coach', 'ابحث عن مدربك')}</p>
      </div>

      {/* Search */}
      <form className="relative">
        <Search size={14} className="absolute top-1/2 -translate-y-1/2" style={{ left: 14, color: '#555' }} />
        <input
          name="q" defaultValue={q}
          placeholder={lbl('Search trainers...', 'ابحث عن مدرب...')}
          className="w-full rounded-xl text-sm text-white"
          style={{
            background: '#141414', border: '1px solid #222',
            paddingLeft: 40, paddingRight: 16, paddingTop: 12, paddingBottom: 12, outline: 'none',
          }}
        />
        {filter && <input type="hidden" name="filter" value={filter} />}
      </form>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {chips.map(c => {
          const active = (filter ?? '') === c.key
          return (
            <Link key={c.key} href={`/subscriber/trainers?${q ? `q=${q}&` : ''}filter=${c.key}`}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={active
                ? { background: '#C8F04B', color: '#000' }
                : { background: '#141414', border: '1px solid #222', color: '#666' }}>
              {c.emoji}{locale === 'ar' ? c.labelAr : c.labelEn}
            </Link>
          )
        })}
      </div>

      {/* Trainers list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl py-16 text-center" style={{ background: '#141414', border: '1px solid #222' }}>
          <p className="text-sm" style={{ color: '#555' }}>{lbl('No trainers found', 'لا يوجد مدربون')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((trainer: any, idx: number) => {
            const profile  = trainer.profiles ?? {}
            const plans    = (trainer.trainer_plans ?? []).filter((p: any) => p.active)
            const cheapest = [...plans].sort((a: any, b: any) => a.price - b.price)[0]
            const isSubbed = myTrainerIds.has(trainer.id)
            const rating   = trainer.rating ?? null
            const clients  = trainer.subscribers_count ?? 0
            const stars    = rating ? Math.round(rating) : 0

            return (
              <Link key={trainer.id} href={`/subscriber/trainers/${trainer.id}`}
                className="rounded-2xl overflow-hidden block transition-opacity hover:opacity-90"
                style={{ background: '#141414', border: '1px solid #222' }}>

                {/* Banner */}
                <div className="relative" style={{ height: 80, background: BANNER_COLORS[idx % BANNER_COLORS.length] }}>
                  {/* Avatar — overlapping banner */}
                  <div className="absolute" style={{ bottom: -28, left: 16 }}>
                    <div className="relative">
                      <div style={{
                        width: 60, height: 60, borderRadius: 18,
                        background: AV_COLORS[idx % AV_COLORS.length],
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: 20, color: '#000',
                        border: '3px solid #141414',
                      }}>
                        {initials(profile.full_name ?? '?')}
                      </div>
                      {/* Verified badge */}
                      <div className="absolute flex items-center justify-center rounded-full"
                        style={{
                          width: 18, height: 18, bottom: 0, right: -2,
                          background: '#4CAF50', border: '2px solid #141414',
                          fontSize: 9, color: '#fff', fontWeight: 900,
                        }}>
                        ✓
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-4 pt-9 pb-4">
                  {/* Name + specialty */}
                  <p className="font-black text-white text-base leading-tight">{profile.full_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#888' }}>{trainer.specialty}</p>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mt-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={11}
                        style={{ color: i < stars ? '#f59e0b' : '#333', fill: i < stars ? '#f59e0b' : 'none' }} />
                    ))}
                    <span className="font-mono font-black text-white text-sm ml-1">
                      {rating ? rating.toFixed(1) : '—'}
                    </span>
                    {trainer.rating_count > 0 && (
                      <span className="text-[10px] ml-0.5" style={{ color: '#555' }}>
                        ({trainer.rating_count})
                      </span>
                    )}
                  </div>

                  {/* Price + Button */}
                  <div className="flex items-center justify-between mt-4">
                    {cheapest ? (
                      <p className="text-sm font-bold" style={{ color: '#C8F04B' }}>
                        {lbl('from', 'من')} {cheapest.currency} {cheapest.price} / {cheapest.duration_days} {lbl('days', 'يوم')}
                      </p>
                    ) : (
                      <p className="text-sm" style={{ color: '#555' }}>{lbl('No plans', 'لا توجد خطط')}</p>
                    )}

                    {isSubbed ? (
                      <span className="px-4 py-2 rounded-full text-xs font-bold"
                        style={{ background: 'rgba(76,175,80,0.15)', color: '#4CAF50' }}>
                        {lbl('Subscribed ✓', 'مشترك ✓')}
                      </span>
                    ) : (
                      <span className="px-5 py-2 rounded-full text-xs font-black"
                        style={{ background: '#C8F04B', color: '#000' }}>
                        {lbl('Subscribe', 'اشترك')}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
