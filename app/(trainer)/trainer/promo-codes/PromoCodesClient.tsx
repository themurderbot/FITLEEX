'use client'

import { useState, useTransition } from 'react'
import { Plus, Tag, Trash2, Pencil, X } from 'lucide-react'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'

interface PromoCode {
  id: string
  code: string
  discount_pct: number
  max_uses?: number | null
  uses_count: number
  expires_at?: string | null
  active: boolean
  created_at: string
}

interface FormState {
  code: string
  discount_pct: string
  max_uses: string
  expires_at: string
  active: boolean
}

const EMPTY_FORM: FormState = { code: '', discount_pct: '10', max_uses: '', expires_at: '', active: true }

// ── Extracted outside parent to prevent remount on state change (focus bug fix) ──
function CodeForm({
  title, form, setForm, onSave, onCancel, saving, lbl,
}: {
  title: string
  form: FormState
  setForm: (updater: (f: FormState) => FormState) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  lbl: (en: string, ar: string) => string
}) {
  return (
    <div className="rounded-xl p-5 flex flex-col gap-4" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-white text-sm">{title}</h2>
        <button onClick={onCancel} className="text-muted hover:text-white transition-colors"><X size={16} /></button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono uppercase tracking-widest" style={{ color: '#555' }}>
            {lbl('Code', 'الكود')}
          </label>
          <input
            className="input font-mono uppercase"
            placeholder="SUMMER20"
            value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono uppercase tracking-widest" style={{ color: '#555' }}>
            {lbl('Discount %', 'نسبة الخصم')}
          </label>
          <input
            className="input"
            type="number"
            min="1"
            max="100"
            value={form.discount_pct}
            onChange={e => setForm(f => ({ ...f, discount_pct: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono uppercase tracking-widest" style={{ color: '#555' }}>
            {lbl('Max Uses', 'الحد الأقصى للاستخدام')}
          </label>
          <input
            className="input"
            type="number"
            placeholder={lbl('Unlimited', 'غير محدود')}
            value={form.max_uses}
            onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-mono uppercase tracking-widest" style={{ color: '#555' }}>
            {lbl('Expiry Date', 'تاريخ الانتهاء')}
          </label>
          <input
            className="input"
            type="date"
            value={form.expires_at}
            onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setForm(f => ({ ...f, active: !f.active }))}
          className="relative shrink-0 transition-colors"
          style={{ width: 36, height: 20, borderRadius: 10, background: form.active ? '#C8F04B' : '#333' }}
        >
          <span className="absolute top-[2px] transition-all"
            style={{ width: 16, height: 16, borderRadius: 8, background: '#000', left: form.active ? 18 : 2 }}
          />
        </button>
        <span className="text-sm" style={{ color: form.active ? '#C8F04B' : '#666' }}>
          {form.active ? lbl('Active', 'مفعّل') : lbl('Inactive', 'معطّل')}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={!form.code.trim() || saving}
          className="px-4 py-2 rounded-lg text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: '#C8F04B', color: '#000' }}
        >
          {saving ? lbl('Saving...', 'جارٍ الحفظ...') : lbl('Save Code', 'حفظ الكود')}
        </button>
        <button onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm transition-colors hover:bg-white/10"
          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888' }}>
          {lbl('Cancel', 'إلغاء')}
        </button>
      </div>
    </div>
  )
}

export function PromoCodesClient({ initialCodes, trainerId }: { initialCodes: PromoCode[]; trainerId: string }) {
  const locale   = useLocale()
  const supabase = createClient()
  const [codes, setCodes]           = useState(initialCodes)
  const [showCreate, setShowCreate] = useState(false)
  const [editCode, setEditCode]     = useState<PromoCode | null>(null)
  const [form, setForm]             = useState<FormState>(EMPTY_FORM)
  const [pending, startTransition]  = useTransition()

  const lbl = (en: string, ar: string) => locale === 'ar' ? ar : en

  function openEdit(c: PromoCode) {
    setEditCode(c)
    setForm({
      code:         c.code,
      discount_pct: String(c.discount_pct),
      max_uses:     c.max_uses != null ? String(c.max_uses) : '',
      expires_at:   c.expires_at ? c.expires_at.split('T')[0] : '',
      active:       c.active,
    })
  }

  function handleCreate() {
    if (!form.code.trim()) return
    startTransition(async () => {
      const { data } = await (supabase.from('promo_codes') as any).insert({
        trainer_id:   trainerId,
        code:         form.code.toUpperCase().trim(),
        discount_pct: Number(form.discount_pct),
        max_uses:     form.max_uses ? Number(form.max_uses) : null,
        expires_at:   form.expires_at || null,
        active:       form.active,
      }).select().single()
      if (data) {
        setCodes(c => [data as PromoCode, ...c])
        setShowCreate(false)
        setForm(EMPTY_FORM)
      }
    })
  }

  function handleSaveEdit() {
    if (!editCode || !form.code.trim()) return
    startTransition(async () => {
      const updates = {
        code:         form.code.toUpperCase().trim(),
        discount_pct: Number(form.discount_pct),
        max_uses:     form.max_uses ? Number(form.max_uses) : null,
        expires_at:   form.expires_at || null,
        active:       form.active,
      }
      await (supabase.from('promo_codes') as any).update(updates).eq('id', editCode.id)
      setCodes(cs => cs.map(c => c.id === editCode.id ? { ...c, ...updates } : c))
      setEditCode(null)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await supabase.from('promo_codes').delete().eq('id', id)
      setCodes(c => c.filter(x => x.id !== id))
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white">{lbl('Promo Codes', 'رموز الخصم')}</h1>
          <p className="text-[11px] font-mono mt-0.5" style={{ color: '#555' }}>
            {codes.length} {lbl('codes', 'كود')}
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(v => !v); setEditCode(null); setForm(EMPTY_FORM) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-opacity hover:opacity-80"
          style={{ background: '#C8F04B', color: '#000' }}
        >
          <Plus size={15} />
          {lbl('New Code', 'كود جديد')}
        </button>
      </div>

      {showCreate && (
        <CodeForm
          title={lbl('Create Promo Code', 'إنشاء كود خصم')}
          form={form}
          setForm={setForm}
          onSave={handleCreate}
          onCancel={() => { setShowCreate(false); setForm(EMPTY_FORM) }}
          saving={pending}
          lbl={lbl}
        />
      )}

      {editCode && (
        <CodeForm
          title={lbl('Edit Promo Code', 'تعديل كود الخصم')}
          form={form}
          setForm={setForm}
          onSave={handleSaveEdit}
          onCancel={() => { setEditCode(null); setForm(EMPTY_FORM) }}
          saving={pending}
          lbl={lbl}
        />
      )}

      <div className="flex flex-col gap-3">
        {codes.map(c => (
          <div key={c.id} className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
            style={{ background: '#141414', border: '1px solid #222' }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-xl"
                style={{ width: 40, height: 40, background: 'rgba(200,240,75,0.08)', border: '1px solid rgba(200,240,75,0.15)' }}>
                <Tag size={16} style={{ color: '#C8F04B' }} />
              </div>
              <div>
                <p className="font-mono font-bold text-white text-sm">{c.code}</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#555' }}>
                  {c.discount_pct}% {lbl('off', 'خصم')} · {c.uses_count}/{c.max_uses ?? '∞'} {lbl('used', 'مستخدم')}
                  {c.expires_at ? ` · ${lbl('exp', 'ينتهي')} ${formatDate(c.expires_at)}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
                background: c.active ? 'rgba(76,175,80,0.15)' : 'rgba(136,136,136,0.12)',
                color: c.active ? '#4CAF50' : '#666',
              }}>
                {c.active ? lbl('Active', 'نشط') : lbl('Inactive', 'معطّل')}
              </span>
              <button
                onClick={() => { openEdit(c); setShowCreate(false) }}
                className="flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
                style={{ width: 32, height: 32, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888' }}
                title={lbl('Edit', 'تعديل')}
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                className="flex items-center justify-center rounded-lg transition-colors hover:bg-red-500/10"
                style={{ width: 32, height: 32, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#555' }}
                title={lbl('Delete', 'حذف')}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
        {!codes.length && (
          <div className="rounded-xl py-14 text-center text-sm" style={{ background: '#141414', border: '1px solid #222', color: '#555' }}>
            {lbl('No promo codes yet', 'لا توجد رموز خصم بعد')}
          </div>
        )}
      </div>
    </div>
  )
}
