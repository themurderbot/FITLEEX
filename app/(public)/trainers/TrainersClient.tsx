'use client'

import { useState }      from 'react'
import Link              from 'next/link'
import Image             from 'next/image'
import { Search, Star, Users, Award } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn }            from '@/lib/utils'
import { getInitials }   from '@/lib/utils'
import type { TrainerCard } from './page'

interface Props {
  trainers:    TrainerCard[]
  specialties: string[]
}

export function TrainersClient({ trainers, specialties }: Props) {
  const t = useTranslations('trainersPage')

  const [search,    setSearch]    = useState('')
  const [specialty, setSpecialty] = useState<string>('all')
  const [sortBy,    setSortBy]    = useState<'rating' | 'price' | 'subscribers'>('rating')

  const filtered = trainers
    .filter(tr => {
      const matchSpec = specialty === 'all' || tr.specialty === specialty
      const q = search.toLowerCase()
      const matchSearch = !q
        || tr.full_name.toLowerCase().includes(q)
        || tr.specialty?.toLowerCase().includes(q)
        || tr.bio?.toLowerCase().includes(q)
        || tr.bio_ar?.includes(search)
      return matchSpec && matchSearch
    })
    .sort((a, b) => {
      if (sortBy === 'rating')      return (b.rating ?? 0) - (a.rating ?? 0)
      if (sortBy === 'price')       return (a.min_price ?? 99999) - (b.min_price ?? 99999)
      if (sortBy === 'subscribers') return b.subscribers_count - a.subscribers_count
      return 0
    })

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-surface-100">
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-3">{t('pageTitle')}</h1>
          <p className="text-muted max-w-lg mx-auto">
            {t('pageSubtitle', { n: trainers.length })}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="input ps-9 w-full"
            />
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="input w-full sm:w-44"
          >
            <option value="rating">{t('sortRating')}</option>
            <option value="price">{t('sortPrice')}</option>
            <option value="subscribers">{t('sortSubscribers')}</option>
          </select>
        </div>

        {/* Specialty chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSpecialty('all')}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              specialty === 'all' ? 'bg-brand text-black' : 'bg-surface-200 text-muted hover:text-white')}
          >
            {t('filterAll')}
          </button>
          {specialties.map(s => (
            <button
              key={s}
              onClick={() => setSpecialty(s)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                specialty === s ? 'bg-brand text-black' : 'bg-surface-200 text-muted hover:text-white')}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-muted">
          {t('resultsCount', { n: filtered.length })}
        </p>

        {/* Grid */}
        {!filtered.length ? (
          <div className="card py-20 text-center text-muted">
            {t('noResults')}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(trainer => (
              <TrainerCardItem key={trainer.id} trainer={trainer} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TrainerCardItem({ trainer }: { trainer: TrainerCard }) {
  const t = useTranslations('trainersPage')

  return (
    <Link href={`/trainers/${trainer.id}`} className="card p-5 flex flex-col gap-4 hover:border-white/20 transition-colors group">
      {trainer.is_featured && (
        <div className="flex">
          <span className="badge badge-brand text-xs">{t('featuredBadge')}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-surface-200 shrink-0">
          {trainer.avatar_url ? (
            <Image
              src={trainer.avatar_url}
              alt={trainer.full_name}
              width={56} height={56}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-brand font-bold text-lg">
              {getInitials(trainer.full_name)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white group-hover:text-brand transition-colors truncate">
            {trainer.full_name}
          </p>
          {trainer.specialty && (
            <p className="text-xs text-muted truncate">{trainer.specialty}</p>
          )}
          <p className="text-xs text-muted">
            {trainer.country} · {t('yearsExp', { n: trainer.years_experience })}
          </p>
        </div>
      </div>

      {(trainer.bio_ar || trainer.bio) && (
        <p className="text-xs text-muted leading-relaxed line-clamp-2">
          {trainer.bio_ar ?? trainer.bio}
        </p>
      )}

      <div className="flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1">
          <Star size={12} className="text-warning fill-warning" />
          <span className="text-white font-medium">{trainer.rating?.toFixed(1) ?? '—'}</span>
          {trainer.rating_count > 0 && <span>({trainer.rating_count})</span>}
        </span>
        <span className="flex items-center gap-1">
          <Users size={12} />
          {t('subscribersCount', { n: trainer.subscribers_count })}
        </span>
        {trainer.years_experience >= 5 && (
          <span className="flex items-center gap-1 text-brand">
            <Award size={12} />
            {t('expertBadge')}
          </span>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-white/[0.06] flex items-center justify-between">
        <div>
          {trainer.min_price !== null ? (
            <>
              <p className="text-xs text-muted">{t('startingFrom')}</p>
              <p className="text-brand font-bold">{trainer.min_price} AED</p>
            </>
          ) : (
            <p className="text-xs text-muted">{t('noPlans')}</p>
          )}
        </div>
        <span className="text-xs text-brand font-medium">{t('viewProfile')}</span>
      </div>
    </Link>
  )
}
