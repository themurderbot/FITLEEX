'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Video } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

interface ExerciseVideo {
  id: string
  title: string
  title_ar?: string
  muscle_group: string
  url: string
  thumbnail_url?: string
  duration_seconds?: number
  created_at: string
}

interface Props {
  videos: ExerciseVideo[]
  muscleLabel: Record<string, string>
  storageUsedGb?: number
  storageMaxGb?: number
  mostUsedVideo?: { name: string; trainerCount: number }
}

export function VideosClient({ videos, muscleLabel, storageUsedGb = 0, storageMaxGb = 50, mostUsedVideo }: Props) {
  const t = useTranslations('admin')
  const [muscle, setMuscle] = useState('all')
  const [q, setQ]           = useState('')

  const muscleGroups = [
    { key: 'all',       label: t('muscleAll') },
    { key: 'chest',     label: t('muscleChest') },
    { key: 'back',      label: t('muscleBack') },
    { key: 'legs',      label: t('muscleLegs') },
    { key: 'shoulders', label: t('muscleShoulders') },
    { key: 'arms',      label: t('muscleArms') },
    { key: 'core',      label: t('muscleCore') },
  ]

  const filtered = videos.filter(v => {
    const matchMuscle = muscle === 'all' || v.muscle_group === muscle
    const matchQ      = !q || v.title.toLowerCase().includes(q.toLowerCase()) || v.title_ar?.includes(q)
    return matchMuscle && matchQ
  })

  const uniqueGroups = Array.from(new Set(videos.map(v => v.muscle_group))).length

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[19px] font-extrabold text-white">{t('videosTitle')}</h1>
          <p className="text-xs text-muted mt-0.5">{t('videoSubtitle')}</p>
        </div>
        <button
          className="text-sm px-4 py-2 rounded-lg font-semibold transition-colors"
          style={{ background: '#C8F04B', color: '#000' }}
        >
          {t('uploadVideoBtn')}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-2xl font-bold font-mono text-white">{formatNumber(videos.length)}</p>
          <p className="stat-label">{t('statTotalVideos')}</p>
          <p className="text-xs text-muted mt-1">{t('statAcrossMuscles', { count: formatNumber(uniqueGroups) })}</p>
        </div>
        <div className="stat-card">
          <p className="text-2xl font-bold font-mono text-white">{storageUsedGb.toFixed(1)} GB</p>
          <p className="stat-label">{t('statStorageUsed')}</p>
          <p className="text-xs text-muted mt-1">{t('statStorageOf', { max: formatNumber(storageMaxGb) })}</p>
        </div>
        <div className="stat-card">
          <p className="text-base font-bold text-white leading-tight">{mostUsedVideo?.name ?? 'Bench Press'}</p>
          <p className="stat-label mt-1">{t('statMostUsed')}</p>
          <p className="text-xs text-muted mt-1">{t('statUsedByTrainers', { count: formatNumber(mostUsedVideo?.trainerCount ?? 89) })}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <input
          className="input w-48"
          placeholder={t('searchVideos')}
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        {muscleGroups.map(mg => (
          <button
            key={mg.key}
            onClick={() => setMuscle(mg.key)}
            className="text-xs px-3 py-1.5 rounded-full border transition-colors"
            style={muscle === mg.key
              ? { background: '#C8F04B', color: '#000', borderColor: '#C8F04B' }
              : { background: 'transparent', color: 'var(--muted)', borderColor: 'rgba(255,255,255,0.1)' }
            }
          >
            {mg.label}
          </button>
        ))}
      </div>

      {/* Video grid — 4 columns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(video => (
          <div key={video.id} className="card p-4 flex flex-col gap-3">
            <div className="w-full h-32 rounded-lg flex items-center justify-center overflow-hidden" style={{ background: '#1a1a1a' }}>
              {video.thumbnail_url ? (
                <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
              ) : (
                <Video size={28} className="text-muted" />
              )}
            </div>
            <div>
              <p className="font-medium text-white text-sm leading-tight">{video.title_ar ?? video.title}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="badge badge-brand text-[10px]">{muscleLabel[video.muscle_group] ?? video.muscle_group}</span>
                {video.duration_seconds && (
                  <span className="text-xs text-muted font-mono">
                    {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {!filtered.length && (
          <div className="col-span-4 text-center py-16 text-muted">{t('noVideos')}</div>
        )}
      </div>
    </div>
  )
}
