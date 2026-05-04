import { createClient } from '@supabase/supabase-js'

const URL = 'https://mtvqixmrisimtlbrpzkd.supabase.co'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10dnFpeG1yaXNpbXRsYnJwemtkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzAyMjY1NCwiZXhwIjoyMDkyNTk4NjU0fQ.gjbonqfS_iFldZYQt42hvv4svt0d3K1fGQWbp7okYMo'

const supabase = createClient(URL, KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function getOrCreate(email, password, meta) {
  // Try to find existing user
  const { data: list } = await supabase.auth.admin.listUsers()
  const existing = list?.users?.find(u => u.email === email)
  if (existing) {
    console.log(`ℹ️  Already exists: ${email} (${existing.id})`)
    return existing
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: meta,
  })
  if (error) { console.error(`❌ ${email}:`, error.message); return null }
  console.log(`✅ Created: ${email} (${data.user.id})`)
  return data.user
}

async function seed() {
  // ── Trainer ──────────────────────────────────────────────────
  const trainerUser = await getOrCreate('trainer@fitfeez.com', 'Fitfeez@123', {
    role: 'trainer', full_name: 'Khalid Al-Harbi', country: 'AE', language: 'ar',
  })
  if (!trainerUser) return

  await supabase.from('profiles').upsert({
    id: trainerUser.id, role: 'trainer',
    full_name: 'Khalid Al-Harbi', country: 'AE', language: 'ar',
  })

  // Upsert trainer row
  let { data: trainerRow } = await supabase
    .from('trainers').select('id').eq('profile_id', trainerUser.id).maybeSingle()

  if (!trainerRow) {
    const { data } = await supabase.from('trainers').insert({
      profile_id:       trainerUser.id,
      specialty:        'Weight Loss & Muscle Gain',
      bio:              'Certified personal trainer with 8 years of experience.',
      years_experience: 8,
      verified:         true,
      approval_status:  'approved',
      commission_rate:  0.80,
    }).select('id').single()
    trainerRow = data
    console.log('✅ Trainer profile created')
  } else {
    console.log('ℹ️  Trainer profile exists')
  }

  // Upsert plan
  let { data: plan } = await supabase
    .from('trainer_plans').select('id').eq('trainer_id', trainerRow.id).maybeSingle()

  if (!plan) {
    const { data } = await supabase.from('trainer_plans').insert({
      trainer_id:   trainerRow.id,
      name:         'Transform 90',
      duration_days: 90,
      price:        599,
      currency:     'AED',
      description:  'Full body transformation program.',
      active:       true,
    }).select('id').single()
    plan = data
    console.log('✅ Trainer plan created')
  } else {
    console.log('ℹ️  Trainer plan exists')
  }

  // ── Subscriber ───────────────────────────────────────────────
  const subUser = await getOrCreate('subscriber@fitfeez.com', 'Fitfeez@123', {
    role: 'subscriber', full_name: 'Layla Al-Amin', country: 'AE', language: 'ar',
  })
  if (!subUser) return

  await supabase.from('profiles').upsert({
    id: subUser.id, role: 'subscriber',
    full_name: 'Layla Al-Amin', country: 'AE', language: 'ar',
  })

  // Subscription
  let { data: sub } = await supabase
    .from('subscriptions').select('id').eq('subscriber_id', subUser.id).maybeSingle()

  if (!sub) {
    const today = new Date().toISOString().slice(0, 10)
    const end   = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)
    const { data, error: subErr } = await supabase.from('subscriptions').insert({
      subscriber_id:  subUser.id,
      trainer_id:     trainerRow.id,
      plan_id:        plan?.id ?? null,
      status:         'active',
      start_date:     today,
      end_date:       end,
      payment_method: 'tap',
    }).select('id').single()
    if (subErr) { console.error('❌ Subscription error:', subErr.message); return }
    sub = data

    const { error: payErr } = await supabase.from('payments').insert({
      subscription_id: sub.id,
      amount: 599, currency: 'AED', method: 'tap', status: 'completed',
    })
    if (payErr) console.error('❌ Payment error:', payErr.message)
    else console.log('✅ Subscription + payment created')
  } else {
    console.log('ℹ️  Subscription exists')
  }

  console.log('\n─────────────────────────────────────────')
  console.log('Admin      → admin@fitfeez.com      / (existing password)')
  console.log('Trainer    → trainer@fitfeez.com    / Fitfeez@123')
  console.log('Subscriber → subscriber@fitfeez.com / Fitfeez@123')
  console.log('─────────────────────────────────────────')
}

seed().catch(console.error)
