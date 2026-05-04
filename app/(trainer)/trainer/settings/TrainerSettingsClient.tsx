'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Plan {
  id: string
  name: string
  price: number
  duration_days: number
}

interface Props {
  profile: { id: string; full_name: string; phone?: string; country: string; language: string; avatar_url?: string }
  trainer: { id: string; specialty?: string; bio?: string; bio_ar?: string; years_experience: number; trainer_plans: any[] }
  plans: any[]
}

type ProfileField = 'name' | 'specialty' | 'country'

const COUNTRIES = [
  '🇸🇦 Saudi Arabia', '🇦🇪 UAE', '🇰🇼 Kuwait', '🇶🇦 Qatar',
  '🇧🇭 Bahrain', '🇴🇲 Oman', '🇯🇴 Jordan', '🇪🇬 Egypt', '🇱🇧 Lebanon',
]

const rowSt: React.CSSProperties = {
  background: 'var(--card)', border: '1px solid var(--border)',
  borderRadius: 'var(--r)', padding: '13px 15px',
  display: 'flex', alignItems: 'center', gap: 11, marginBottom: 9,
}
const lblSt: React.CSSProperties = { fontSize: 12, color: 'var(--text2)', width: 120, flexShrink: 0 }
const valSt: React.CSSProperties = { fontSize: 13, fontWeight: 600, flex: 1, color: 'var(--text)' }
const valMonoSt: React.CSSProperties = { ...valSt, fontFamily: 'var(--mono)' }
const editLinkSt: React.CSSProperties = { fontSize: 12, color: 'var(--accent)', cursor: 'pointer' }
const inpSt: React.CSSProperties = {
  flex: 1, background: 'var(--surface)', border: '1px solid var(--accent)',
  borderRadius: 6, padding: '5px 9px', color: 'var(--text)',
  fontSize: 13, fontFamily: 'var(--sans)', outline: 'none',
}
const selSt: React.CSSProperties = {
  flex: 1, background: 'var(--surface)', border: '1px solid var(--accent)',
  borderRadius: 6, padding: '5px 9px', color: 'var(--text)',
  fontSize: 13, fontFamily: 'var(--sans)',
}
const numSt: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--accent)',
  borderRadius: 6, padding: '5px 8px', color: 'var(--text)',
  fontSize: 13, fontFamily: 'var(--mono)', outline: 'none', textAlign: 'center',
}
const saveBtnSt: React.CSSProperties = {
  background: 'var(--accent)', color: '#0a0a0a', border: 'none',
  borderRadius: 6, padding: '4px 11px', fontSize: 12,
  fontFamily: 'var(--sans)', fontWeight: 600, cursor: 'pointer',
}
const cancelBtnSt: React.CSSProperties = {
  background: 'var(--card)', border: '1px solid var(--border)',
  color: 'var(--text2)', borderRadius: 6, padding: '4px 11px',
  fontSize: 12, fontFamily: 'var(--sans)', cursor: 'pointer',
}
const addPlanBtnSt: React.CSSProperties = {
  marginTop: 6, background: 'var(--card)', border: '1px solid var(--border)',
  color: 'var(--text2)', borderRadius: 6, padding: '6px 13px',
  fontSize: 12, fontFamily: 'var(--sans)', cursor: 'pointer',
}

export function TrainerSettingsClient({ profile, trainer, plans: initialPlans }: Props) {
  const supabase = createClient()
  const [, startTransition] = useTransition()

  const [profileData, setProfileData] = useState({
    full_name: profile.full_name,
    specialty: trainer.specialty ?? '',
    country: profile.country,
  })
  const [editingField, setEditingField] = useState<ProfileField | null>(null)
  const [editVal, setEditVal] = useState('')

  const [plans, setPlans] = useState<Plan[]>(
    initialPlans.map((p: any) => ({
      id: p.id, name: p.name ?? 'Plan',
      price: p.price ?? 0, duration_days: p.duration_days ?? 30,
    }))
  )
  const [editingPlan, setEditingPlan] = useState<string | null>(null)
  const [planEdit, setPlanEdit] = useState({ name: '', price: '', days: '' })

  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  function startEditField(field: ProfileField) {
    setEditingField(field)
    setEditVal(
      field === 'name' ? profileData.full_name :
      field === 'specialty' ? profileData.specialty :
      profileData.country
    )
  }

  function cancelEditField() { setEditingField(null); setEditVal('') }

  function saveField(field: ProfileField) {
    startTransition(async () => {
      if (field === 'name') {
        await (supabase.from('profiles') as any).update({ full_name: editVal }).eq('id', profile.id)
        setProfileData(d => ({ ...d, full_name: editVal }))
      } else if (field === 'specialty') {
        await (supabase.from('trainers') as any).update({ specialty: editVal }).eq('id', trainer.id)
        setProfileData(d => ({ ...d, specialty: editVal }))
      } else if (field === 'country') {
        await (supabase.from('profiles') as any).update({ country: editVal }).eq('id', profile.id)
        setProfileData(d => ({ ...d, country: editVal }))
      }
      setEditingField(null)
      showToast('Saved!')
    })
  }

  function startPlanEdit(plan: Plan) {
    setEditingPlan(plan.id)
    setPlanEdit({ name: plan.name, price: String(plan.price), days: String(plan.duration_days) })
  }

  function cancelPlanEdit() { setEditingPlan(null) }

  function savePlan(planId: string) {
    startTransition(async () => {
      const price = Number(planEdit.price)
      const duration_days = Number(planEdit.days)
      const name = planEdit.name.trim() || 'Plan'
      await (supabase.from('trainer_plans') as any).update({ name, price, duration_days }).eq('id', planId)
      setPlans(ps => ps.map(p => p.id === planId ? { ...p, name, price, duration_days } : p))
      setEditingPlan(null)
      showToast('Plan updated!')
    })
  }

  function addPlan() {
    setEditingPlan('new')
    setPlanEdit({ name: '', price: '300', days: '30' })
  }

  function saveNewPlan() {
    startTransition(async () => {
      const price = Number(planEdit.price)
      const duration_days = Number(planEdit.days)
      const name = planEdit.name.trim() || 'New Plan'
      const { data } = await (supabase.from('trainer_plans') as any).insert({
        trainer_id: trainer.id, name,
        price, duration_days, active: true,
      }).select().single()
      if (data) {
        setPlans(ps => [...ps, {
          id: data.id, name: data.name,
          price: data.price, duration_days: data.duration_days,
        }])
      }
      setEditingPlan(null)
      showToast('Plan added!')
    })
  }

  const isEditingName = editingField === 'name'
  const isEditingSpec = editingField === 'specialty'
  const isEditingCountry = editingField === 'country'

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Settings</div>
      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>Manage your profile and plans</div>

      {/* ── Profile Section ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'var(--mono)' }}>
          Profile
        </div>

        {/* Display Name */}
        <div style={rowSt}>
          <div style={lblSt}>Display Name</div>
          {!isEditingName && <div style={valSt}>{profileData.full_name}</div>}
          {isEditingName && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input style={inpSt} value={editVal} autoFocus onChange={e => setEditVal(e.target.value)} />
              <button style={saveBtnSt} onClick={() => saveField('name')}>Save</button>
              <button style={cancelBtnSt} onClick={cancelEditField}>Cancel</button>
            </div>
          )}
          {!isEditingName && <div style={editLinkSt} onClick={() => startEditField('name')}>Edit</div>}
        </div>

        {/* Specialty */}
        <div style={rowSt}>
          <div style={lblSt}>Specialty</div>
          {!isEditingSpec && <div style={valSt}>{profileData.specialty || '—'}</div>}
          {isEditingSpec && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input style={inpSt} value={editVal} autoFocus onChange={e => setEditVal(e.target.value)} />
              <button style={saveBtnSt} onClick={() => saveField('specialty')}>Save</button>
              <button style={cancelBtnSt} onClick={cancelEditField}>Cancel</button>
            </div>
          )}
          {!isEditingSpec && <div style={editLinkSt} onClick={() => startEditField('specialty')}>Edit</div>}
        </div>

        {/* Country */}
        <div style={rowSt}>
          <div style={lblSt}>Country</div>
          {!isEditingCountry && <div style={valSt}>{profileData.country}</div>}
          {isEditingCountry && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <select style={selSt} value={editVal} onChange={e => setEditVal(e.target.value)}>
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <button style={saveBtnSt} onClick={() => saveField('country')}>Save</button>
              <button style={cancelBtnSt} onClick={cancelEditField}>Cancel</button>
            </div>
          )}
          {!isEditingCountry && <div style={editLinkSt} onClick={() => startEditField('country')}>Edit</div>}
        </div>
      </div>

      {/* ── Subscription Plans Section ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'var(--mono)' }}>
          Subscription Plans
        </div>

        {plans.map(plan => {
          const isEditing = editingPlan === plan.id
          return (
            <div key={plan.id} style={rowSt}>
              <div style={lblSt}>{plan.name}</div>
              {!isEditing && (
                <div style={valMonoSt}>AED {plan.price} · {plan.duration_days} days</div>
              )}
              {isEditing && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input style={{ ...inpSt, width: 140 }} placeholder="Plan name" value={planEdit.name}
                      autoFocus onChange={e => setPlanEdit(p => ({ ...p, name: e.target.value }))} />
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>SAR</span>
                    <input type="number" style={{ ...numSt, width: 72 }} value={planEdit.price}
                      min={50} max={5000} onChange={e => setPlanEdit(p => ({ ...p, price: e.target.value }))} />
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>·</span>
                    <input type="number" style={{ ...numSt, width: 56 }} value={planEdit.days}
                      min={1} max={365} onChange={e => setPlanEdit(p => ({ ...p, days: e.target.value }))} />
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>days</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={saveBtnSt} onClick={() => savePlan(plan.id)}>Save</button>
                    <button style={cancelBtnSt} onClick={cancelPlanEdit}>Cancel</button>
                  </div>
                </div>
              )}
              {!isEditing && <div style={editLinkSt} onClick={() => startPlanEdit(plan)}>Edit</div>}
            </div>
          )
        })}

        {/* Add new plan inline row */}
        {editingPlan === 'new' && (
          <div style={rowSt}>
            <div style={lblSt}>New Plan</div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input style={{ ...inpSt, width: 140 }} placeholder="Plan name" value={planEdit.name}
                  autoFocus onChange={e => setPlanEdit(p => ({ ...p, name: e.target.value }))} />
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>SAR</span>
                <input type="number" style={{ ...numSt, width: 72 }} value={planEdit.price}
                  min={50} max={5000} onChange={e => setPlanEdit(p => ({ ...p, price: e.target.value }))} />
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>·</span>
                <input type="number" style={{ ...numSt, width: 56 }} value={planEdit.days}
                  min={1} max={365} onChange={e => setPlanEdit(p => ({ ...p, days: e.target.value }))} />
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>days</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={saveBtnSt} onClick={saveNewPlan}>Save</button>
                <button style={cancelBtnSt} onClick={cancelPlanEdit}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {editingPlan !== 'new' && (
          <button style={addPlanBtnSt} onClick={addPlan}>+ Add Plan</button>
        )}
      </div>

      {toast && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(200,240,75,.1)', border: '1px solid rgba(200,240,75,.2)', borderRadius: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{toast}</span>
        </div>
      )}
    </div>
  )
}
