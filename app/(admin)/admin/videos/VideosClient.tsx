'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { X, Upload, Loader2, Video, CheckCircle2 } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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

const MUSCLE_GROUPS = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core']

const LIB = [
  { id: 'bench-press',     name: 'Bench press',      muscle: 'chest' },
  { id: 'incline-db',      name: 'Incline DB press',  muscle: 'chest' },
  { id: 'cable-flyes',     name: 'Cable flyes',       muscle: 'chest' },
  { id: 'push-ups',        name: 'Push-ups',          muscle: 'chest' },
  { id: 'pull-ups',        name: 'Pull-ups',          muscle: 'back'  },
  { id: 'barbell-row',     name: 'Barbell row',       muscle: 'back'  },
  { id: 'lat-pulldown',    name: 'Lat pulldown',      muscle: 'back'  },
  { id: 'deadlift',        name: 'Deadlift',          muscle: 'back'  },
  { id: 'squats',          name: 'Squats',            muscle: 'legs'  },
  { id: 'leg-press',       name: 'Leg press',         muscle: 'legs'  },
  { id: 'leg-curl',        name: 'Leg curl',          muscle: 'legs'  },
  { id: 'lunges',          name: 'Lunges',            muscle: 'legs'  },
  { id: 'ohp',             name: 'OHP',               muscle: 'shoulders' },
  { id: 'lateral-raises',  name: 'Lateral raises',    muscle: 'shoulders' },
  { id: 'face-pulls',      name: 'Face pulls',        muscle: 'shoulders' },
  { id: 'barbell-curl',    name: 'Barbell curl',      muscle: 'arms'  },
  { id: 'hammer-curl',     name: 'Hammer curl',       muscle: 'arms'  },
  { id: 'tricep-pushdown', name: 'Tricep pushdown',   muscle: 'arms'  },
  { id: 'skull-crusher',   name: 'Skull crusher',     muscle: 'arms'  },
  { id: 'plank',           name: 'Plank',             muscle: 'core'  },
  { id: 'crunches',        name: 'Crunches',          muscle: 'core'  },
]

const MUSCLE_COLOR: Record<string, string> = {
  chest: '#FF6B35', back: '#4D9EFF', legs: '#C8F04B',
  shoulders: '#a78bfa', arms: '#4CAF50', core: '#fff',
}

function matchVideo(exName: string, videos: ExerciseVideo[]): ExerciseVideo | undefined {
  const n = exName.toLowerCase()
  return videos.find(v =>
    v.title.toLowerCase().includes(n) || n.includes(v.title.toLowerCase())
  )
}

export function VideosClient({ videos: initial, muscleLabel, storageUsedGb = 0, storageMaxGb = 50, mostUsedVideo }: Props) {
  const t      = useTranslations('admin')
  const router = useRouter()

  const [tab, setTab]           = useState<'videos' | 'library'>('videos')
  const [muscle, setMuscle]     = useState('all')
  const [q, setQ]               = useState('')
  const [showModal, setShowModal] = useState(false)
  const [playVideo, setPlayVideo] = useState<ExerciseVideo | null>(null)

  // Upload form
  const [title, setTitle]       = useState('')
  const [titleAr, setTitleAr]   = useState('')
  const [group, setGroup]       = useState('chest')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const muscleGroups = [
    { key: 'all',       label: t('muscleAll') },
    { key: 'chest',     label: t('muscleChest') },
    { key: 'back',      label: t('muscleBack') },
    { key: 'legs',      label: t('muscleLegs') },
    { key: 'shoulders', label: t('muscleShoulders') },
    { key: 'arms',      label: t('muscleArms') },
    { key: 'core',      label: t('muscleCore') },
  ]

  const filtered = initial.filter(v => {
    const matchMuscle = muscle === 'all' || v.muscle_group === muscle
    const matchQ      = !q || v.title.toLowerCase().includes(q.toLowerCase()) || v.title_ar?.includes(q)
    return matchMuscle && matchQ
  })

  const filteredLib = LIB.filter(ex => {
    const matchMuscle = muscle === 'all' || ex.muscle === muscle
    const matchQ      = !q || ex.name.toLowerCase().includes(q.toLowerCase())
    return matchMuscle && matchQ
  })

  const uniqueGroups   = Array.from(new Set(initial.map(v => v.muscle_group))).length
  const linkedCount    = LIB.filter(ex => matchVideo(ex.name, initial)).length

  function resetForm() {
    setTitle(''); setTitleAr(''); setGroup('chest')
    setVideoFile(null); setUploadErr(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function openUploadFor(exName: string, exMuscle: string) {
    setTitle(exName)
    setGroup(exMuscle)
    setTitleAr('')
    setVideoFile(null)
    setUploadErr(null)
    if (fileRef.current) fileRef.current.value = ''
    setShowModal(true)
  }

  async function handleUpload() {
    if (!title || !videoFile) { setUploadErr('أدخل العنوان وارفع الفيديو'); return }
    setUploading(true); setUploadErr(null)
    try {
      const supabase = createClient()
      const ext  = videoFile.name.split('.').pop()
      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error: storageErr } = await supabase.storage.from('videos').upload(path, videoFile)
      if (storageErr) throw storageErr
      const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(path)
      const { error: dbErr } = await (supabase as any).from('exercise_videos').insert({
        title, title_ar: titleAr || null, muscle_group: group, url: publicUrl,
      })
      if (dbErr) throw dbErr
      setShowModal(false)
      resetForm()
      router.refresh()
    } catch (e: any) {
      setUploadErr(e?.message ?? 'حدث خطأ')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[19px] font-extrabold text-white">{t('videosTitle')}</h1>
            <p className="text-xs text-muted mt-0.5">{t('videoSubtitle')}</p>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true) }}
            className="text-sm px-4 py-2 rounded-lg font-semibold transition-colors"
            style={{ background: '#C8F04B', color: '#000' }}>
            {t('uploadVideoBtn')}
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card">
            <p className="text-2xl font-bold font-mono text-white">{formatNumber(initial.length)}</p>
            <p className="stat-label">{t('statTotalVideos')}</p>
            <p className="text-xs text-muted mt-1">{t('statAcrossMuscles', { count: formatNumber(uniqueGroups) })}</p>
          </div>
          <div className="stat-card">
            <p className="text-2xl font-bold font-mono text-white">{linkedCount} / {LIB.length}</p>
            <p className="stat-label">Exercises with video</p>
            <p className="text-xs text-muted mt-1">{LIB.length - linkedCount} still missing</p>
          </div>
          <div className="stat-card">
            <p className="text-2xl font-bold font-mono text-white">{storageUsedGb.toFixed(1)} GB</p>
            <p className="stat-label">{t('statStorageUsed')}</p>
            <p className="text-xs text-muted mt-1">{t('statStorageOf', { max: formatNumber(storageMaxGb) })}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: '#161616', border: '1px solid #222', width: 'fit-content' }}>
          {([
            { k: 'library', label: `Exercise Library (${LIB.length})` },
            { k: 'videos',  label: `Uploaded Videos (${initial.length})` },
          ] as const).map(v => (
            <button key={v.k} onClick={() => setTab(v.k)}
              className="px-4 py-2 rounded-md text-sm font-semibold transition-colors"
              style={tab === v.k ? { background: '#C8F04B', color: '#000' } : { color: '#666' }}>
              {v.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap items-center">
          <input className="input w-48" placeholder={t('searchVideos')}
            value={q} onChange={e => setQ(e.target.value)} />
          {muscleGroups.map(mg => (
            <button key={mg.key} onClick={() => setMuscle(mg.key)}
              className="text-xs px-3 py-1.5 rounded-full border transition-colors"
              style={muscle === mg.key
                ? { background: '#C8F04B', color: '#000', borderColor: '#C8F04B' }
                : { background: 'transparent', color: 'var(--muted)', borderColor: 'rgba(255,255,255,0.1)' }}>
              {mg.label}
            </button>
          ))}
        </div>

        {/* ── Exercise Library Tab ── */}
        {tab === 'library' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredLib.map(ex => {
              const vid = matchVideo(ex.name, initial)
              const mc  = MUSCLE_COLOR[ex.muscle] ?? '#888'
              return (
                <div key={ex.id} className="card p-0 overflow-hidden flex flex-col"
                  style={{ border: vid ? '1px solid rgba(200,240,75,0.2)' : '1px solid #222' }}>
                  {/* Thumbnail area */}
                  <div className="w-full h-28 relative" style={{ background: '#1a1a1a' }}>
                    {vid ? (
                      <>
                        <video src={vid.url} preload="metadata" muted playsInline
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setPlayVideo(vid)} />
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 size={16} style={{ color: '#C8F04B' }} />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1"
                        style={{ color: '#2a2a2a' }}>
                        <Video size={24} />
                        <span className="text-[10px]">No video</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 flex flex-col gap-2 flex-1">
                    <div>
                      <p className="font-semibold text-white text-sm leading-tight">{ex.name}</p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block capitalize"
                        style={{ background: `${mc}18`, color: mc }}>
                        {ex.muscle}
                      </span>
                    </div>
                    {vid ? (
                      <button onClick={() => openUploadFor(ex.name, ex.muscle)}
                        className="text-[11px] font-semibold py-1.5 rounded-lg transition-colors hover:opacity-80"
                        style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#666' }}>
                        Replace video
                      </button>
                    ) : (
                      <button onClick={() => openUploadFor(ex.name, ex.muscle)}
                        className="text-[11px] font-bold py-1.5 rounded-lg transition-opacity hover:opacity-80"
                        style={{ background: '#C8F04B', color: '#000' }}>
                        + Upload video
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            {!filteredLib.length && (
              <div className="col-span-4 text-center py-16 text-muted">{t('noVideos')}</div>
            )}
          </div>
        )}

        {/* ── Uploaded Videos Tab ── */}
        {tab === 'videos' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(video => (
              <div key={video.id} className="card p-4 flex flex-col gap-3 cursor-pointer hover:border-white/20 transition-colors"
                onClick={() => setPlayVideo(video)}>
                <div className="w-full h-32 rounded-lg overflow-hidden relative group" style={{ background: '#1a1a1a' }}>
                  {video.thumbnail_url ? (
                    <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <video src={video.url} preload="metadata" muted playsInline
                      className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#C8F04B' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#000"><polygon points="5,3 19,12 5,21"/></svg>
                    </div>
                  </div>
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
        )}
      </div>

      {/* Play Modal */}
      {playVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(6px)' }}
          onClick={() => setPlayVideo(null)}>
          <div className="w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-bold">{playVideo.title_ar ?? playVideo.title}</p>
              <button onClick={() => setPlayVideo(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                style={{ color: '#888' }}>
                <X size={16} />
              </button>
            </div>
            <video src={playVideo.url} controls autoPlay
              className="w-full rounded-xl" style={{ maxHeight: '70vh', background: '#000' }} />
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: '#141414', border: '1px solid #2a2a2a' }}>

            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">رفع فيديو تمرين</h2>
              <button onClick={() => { setShowModal(false); resetForm() }}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                style={{ color: '#888' }}>
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-muted mb-1 block">العنوان (English) *</label>
                <input className="input w-full" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Barbell Squat" />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">العنوان (عربي)</label>
                <input className="input w-full" value={titleAr} onChange={e => setTitleAr(e.target.value)} placeholder="مثال: القرفصاء بالبار" dir="rtl" />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">مجموعة العضلات</label>
                <select className="input w-full" value={group} onChange={e => setGroup(e.target.value)}>
                  {MUSCLE_GROUPS.map(g => (
                    <option key={g} value={g}>{muscleLabel[g] ?? g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">ملف الفيديو *</label>
                <div className="w-full rounded-xl flex flex-col items-center justify-center gap-2 py-6 cursor-pointer transition-colors hover:bg-white/5"
                  style={{ border: '2px dashed #333' }}
                  onClick={() => fileRef.current?.click()}>
                  <Upload size={20} style={{ color: '#555' }} />
                  <p className="text-xs" style={{ color: '#555' }}>
                    {videoFile ? videoFile.name : 'اضغط لاختيار الفيديو (MP4, MOV)'}
                  </p>
                </div>
                <input ref={fileRef} type="file" accept="video/*" className="hidden"
                  onChange={e => setVideoFile(e.target.files?.[0] ?? null)} />
              </div>
            </div>

            {uploadErr && (
              <p className="text-xs text-center" style={{ color: '#FF4D4D' }}>{uploadErr}</p>
            )}

            <button onClick={handleUpload} disabled={uploading}
              className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
              style={{ background: '#C8F04B', color: '#000' }}>
              {uploading ? <><Loader2 size={14} className="animate-spin" /> جاري الرفع...</> : 'رفع الفيديو'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
