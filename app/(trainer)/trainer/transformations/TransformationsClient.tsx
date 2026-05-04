'use client'

import { useState, useTransition, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, Trash2, Plus, X, GripVertical, Loader2, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Transformation {
  id: string
  before_url: string
  after_url: string
  caption?: string
  caption_ar?: string
  sort_order: number
}

interface Props {
  trainerId: string
  initial: Transformation[]
}

export function TransformationsClient({ trainerId, initial }: Props) {
  const supabase = createClient()
  const router   = useRouter()

  const [items,    setItems]    = useState<Transformation[]>(initial)
  const [adding,   setAdding]   = useState(false)
  const [pending,  startTrans]  = useTransition()
  const [toast,    setToast]    = useState('')

  const [beforeFile,  setBeforeFile]  = useState<File | null>(null)
  const [afterFile,   setAfterFile]   = useState<File | null>(null)
  const [beforePrev,  setBeforePrev]  = useState<string | null>(null)
  const [afterPrev,   setAfterPrev]   = useState<string | null>(null)
  const [caption,     setCaption]     = useState('')
  const [captionAr,   setCaptionAr]   = useState('')

  const beforeRef = useRef<HTMLInputElement>(null)
  const afterRef  = useRef<HTMLInputElement>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  function pickFile(which: 'before' | 'after', file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      const src = e.target?.result as string
      if (which === 'before') { setBeforeFile(file); setBeforePrev(src) }
      else                    { setAfterFile(file);  setAfterPrev(src) }
    }
    reader.readAsDataURL(file)
  }

  async function uploadPhoto(file: File, prefix: 'before' | 'after'): Promise<string | null> {
    const ext  = file.name.split('.').pop()
    const path = `${trainerId}/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('transformations').upload(path, file)
    if (error) return null
    const { data } = supabase.storage.from('transformations').getPublicUrl(path)
    return data.publicUrl
  }

  function resetForm() {
    setBeforeFile(null); setAfterFile(null)
    setBeforePrev(null); setAfterPrev(null)
    setCaption(''); setCaptionAr('')
    setAdding(false)
  }

  function handleAdd() {
    if (!beforeFile || !afterFile) return
    startTrans(async () => {
      const [beforeUrl, afterUrl] = await Promise.all([
        uploadPhoto(beforeFile, 'before'),
        uploadPhoto(afterFile,  'after'),
      ])
      if (!beforeUrl || !afterUrl) { showToast('Upload failed'); return }

      const { data } = await (supabase as any)
        .from('transformations')
        .insert({
          trainer_id: trainerId,
          before_url: beforeUrl,
          after_url:  afterUrl,
          caption:    caption || null,
          caption_ar: captionAr || null,
          sort_order: items.length + 1,
        })
        .select()
        .single()

      if (data) {
        setItems(prev => [...prev, data as Transformation])
        resetForm()
        showToast('Added successfully!')
        router.refresh()
      }
    })
  }

  function handleDelete(id: string) {
    startTrans(async () => {
      await (supabase as any).from('transformations').delete().eq('id', id)
      setItems(prev => prev.filter(t => t.id !== id))
      showToast('Deleted')
    })
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white">Transformations</h1>
          <p className="text-xs mt-0.5" style={{ color: '#555' }}>
            Before & after photos shown on your public profile
          </p>
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
            style={{ background: '#C8F04B', color: '#000' }}>
            <Plus size={15} /> Add New
          </button>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.25)' }}>
          <CheckCircle2 size={15} style={{ color: '#4CAF50' }} />
          <span className="text-sm font-bold" style={{ color: '#4CAF50' }}>{toast}</span>
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#141414', border: '1px solid rgba(200,240,75,0.25)' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg,#C8F04B,#7ab82e)' }} />
          <div className="p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="font-black text-white text-sm">New Transformation</p>
              <button onClick={resetForm} className="rounded-lg p-1 hover:bg-white/5">
                <X size={16} style={{ color: '#666' }} />
              </button>
            </div>

            {/* Photo pickers */}
            <div className="grid grid-cols-2 gap-3">
              {/* Before */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold" style={{ color: '#888' }}>
                  😓 Before Photo
                </label>
                <button onClick={() => beforeRef.current?.click()}
                  className="relative rounded-xl overflow-hidden flex items-center justify-center transition-opacity hover:opacity-80"
                  style={{ height: 160, background: '#1a1a1a', border: `2px dashed ${beforePrev ? '#C8F04B' : '#333'}` }}>
                  {beforePrev
                    ? <img src={beforePrev} alt="" className="w-full h-full object-cover" />
                    : <div className="flex flex-col items-center gap-2">
                        <Camera size={28} style={{ color: '#444' }} />
                        <span className="text-xs" style={{ color: '#555' }}>Click to upload</span>
                      </div>
                  }
                </button>
                <input ref={beforeRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && pickFile('before', e.target.files[0])} />
              </div>

              {/* After */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold" style={{ color: '#888' }}>
                  😎 After Photo
                </label>
                <button onClick={() => afterRef.current?.click()}
                  className="relative rounded-xl overflow-hidden flex items-center justify-center transition-opacity hover:opacity-80"
                  style={{ height: 160, background: '#1a1a1a', border: `2px dashed ${afterPrev ? '#C8F04B' : '#333'}` }}>
                  {afterPrev
                    ? <img src={afterPrev} alt="" className="w-full h-full object-cover" />
                    : <div className="flex flex-col items-center gap-2">
                        <Camera size={28} style={{ color: '#444' }} />
                        <span className="text-xs" style={{ color: '#555' }}>Click to upload</span>
                      </div>
                  }
                </button>
                <input ref={afterRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && pickFile('after', e.target.files[0])} />
              </div>
            </div>

            {/* Captions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold" style={{ color: '#888' }}>Caption (English)</label>
                <input value={caption} onChange={e => setCaption(e.target.value)}
                  placeholder="e.g. Lost 12kg in 3 months"
                  className="rounded-xl text-sm text-white"
                  style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', padding: '10px 14px', outline: 'none' }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold" style={{ color: '#888' }}>التعليق (عربي)</label>
                <input value={captionAr} onChange={e => setCaptionAr(e.target.value)}
                  placeholder="مثال: فقد ١٢ كيلو في ٣ أشهر"
                  dir="rtl"
                  className="rounded-xl text-sm text-white"
                  style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', padding: '10px 14px', outline: 'none' }} />
              </div>
            </div>

            {/* Submit */}
            <button onClick={handleAdd}
              disabled={!beforeFile || !afterFile || pending}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-black transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ background: '#C8F04B', color: '#000' }}>
              {pending
                ? <><Loader2 size={16} className="animate-spin" /> Uploading...</>
                : 'Save Transformation'}
            </button>
          </div>
        </div>
      )}

      {/* Existing transformations */}
      {items.length === 0 && !adding ? (
        <div className="rounded-2xl py-20 text-center flex flex-col items-center gap-4"
          style={{ background: '#141414', border: '1px dashed #222' }}>
          <Camera size={40} style={{ color: '#333' }} />
          <div>
            <p className="font-bold text-white text-sm">No transformations yet</p>
            <p className="text-xs mt-1" style={{ color: '#555' }}>
              Add before & after photos to showcase your results
            </p>
          </div>
          <button onClick={() => setAdding(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
            style={{ background: '#C8F04B', color: '#000' }}>
            Add First Transformation
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((t, idx) => (
            <div key={t.id} className="rounded-2xl overflow-hidden"
              style={{ background: '#141414', border: '1px solid #222' }}>
              <div className="flex" style={{ height: 180 }}>
                {/* Before */}
                <div className="flex-1 relative">
                  <img src={t.before_url} alt="Before" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg"
                    style={{ background: 'rgba(0,0,0,0.65)' }}>
                    <span className="text-xs font-black text-white">😓 Before</span>
                  </div>
                </div>
                <div style={{ width: 3, background: '#0a0a0a' }} />
                {/* After */}
                <div className="flex-1 relative">
                  <img src={t.after_url} alt="After" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg"
                    style={{ background: 'rgba(0,0,0,0.65)' }}>
                    <span className="text-xs font-black" style={{ color: '#C8F04B' }}>😎 After</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderTop: '1px solid #1e1e1e' }}>
                <div className="flex-1 min-w-0">
                  {t.caption
                    ? <p className="text-xs text-white font-semibold truncate">{t.caption}</p>
                    : <p className="text-xs" style={{ color: '#444' }}>No caption</p>
                  }
                  <p className="text-[10px] mt-0.5" style={{ color: '#444' }}>#{idx + 1}</p>
                </div>
                <button onClick={() => handleDelete(t.id)}
                  className="flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-red-500/10"
                  style={{ color: '#FF4D4D' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
