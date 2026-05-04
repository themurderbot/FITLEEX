// node scripts/seed-full.mjs
// Seeds subscribers, subscriptions, conversations, messages, progress, promo codes
// for the khalid trainer (already created by seed-trainer.mjs)

import { createClient } from '@supabase/supabase-js'

const URL = 'https://mtvqixmrisimtlbrpzkd.supabase.co'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10dnFpeG1yaXNpbXRsYnJwemtkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzAyMjY1NCwiZXhwIjoyMDkyNTk4NjU0fQ.gjbonqfS_iFldZYQt42hvv4svt0d3K1fGQWbp7okYMo'

const sb = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const TRAINER_PROFILE_ID = '095536b4-7c37-4020-a3f1-ed506c36fa08'
const TRAINER_ID         = 'c3e021cc-b63d-40cc-a328-b064703cd6b6'

// Fixed plan IDs (already inserted by seed-trainer.mjs)
async function getPlanIds() {
  const { data } = await sb.from('trainer_plans').select('id, name').eq('trainer_id', TRAINER_ID)
  return data ?? []
}

async function createSubscriber(email, fullName, country) {
  // Try create, ignore if already exists
  const { data, error } = await sb.auth.admin.createUser({
    email, password: 'Fitfeez123!', email_confirm: true,
    user_metadata: { role: 'subscriber', full_name: fullName, country, language: 'ar' },
  })
  if (error && !error.message.includes('already')) console.warn(email, error.message)

  const userId = data?.user?.id ?? (await sb.auth.admin.listUsers())
    .data?.users?.find(u => u.email === email)?.id
  if (!userId) throw new Error('Could not get userId for ' + email)

  await sb.from('profiles').upsert({
    id: userId, role: 'subscriber', full_name: fullName, country, language: 'ar',
  }, { onConflict: 'id' })

  return userId
}

async function run() {
  const plans = await getPlanIds()
  const kickstart = plans.find(p => p.name.includes('Kickstart')) ?? plans[0]
  const transform = plans.find(p => p.name.includes('Transform')) ?? plans[0]

  if (!kickstart) { console.error('No plans found — run seed-trainer.mjs first'); process.exit(1) }

  console.log('── Creating subscribers...')
  const [ahmedId, saraId, omarId, laylaId] = await Promise.all([
    createSubscriber('ahmed.k@fitfeez.com',  'Ahmed Khalil',     'KW'),
    createSubscriber('sara.m@fitfeez.com',   'Sara Mohammed',    'SA'),
    createSubscriber('omar.r@fitfeez.com',   'Omar Rashed',      'AE'),
    createSubscriber('layla.a@fitfeez.com',  'Layla Al-Amin',    'SA'),
  ])
  console.log('✓ Subscribers created')

  // Clear existing test data for this trainer
  const { data: existingSubs } = await sb.from('subscriptions').select('id').eq('trainer_id', TRAINER_ID)
  if (existingSubs?.length) {
    const ids = existingSubs.map(s => s.id)
    await sb.from('progress_submissions').delete().in('subscription_id', ids)
    await sb.from('messages').delete().in('conversation_id',
      (await sb.from('conversations').select('id').eq('trainer_id', TRAINER_ID)).data?.map(c=>c.id) ?? []
    )
    await sb.from('conversations').delete().eq('trainer_id', TRAINER_ID)
    await sb.from('payments').delete().in('subscription_id', ids)
    await sb.from('subscriptions').delete().eq('trainer_id', TRAINER_ID)
  }
  await sb.from('promo_codes').delete().eq('trainer_id', TRAINER_ID)

  console.log('── Inserting subscriptions...')
  const now = new Date()
  const d = (daysAgo) => {
    const dt = new Date(now); dt.setDate(dt.getDate() - daysAgo); return dt.toISOString().split('T')[0]
  }
  const de = (daysAhead) => {
    const dt = new Date(now); dt.setDate(dt.getDate() + daysAhead); return dt.toISOString().split('T')[0]
  }

  // Insert subscriptions one-by-one and re-fetch to avoid trigger issues
  const subRows = [
    { subscriber_id: ahmedId, trainer_id: TRAINER_ID, plan_id: kickstart.id, status: 'active',   payment_method: 'tap',   start_date: d(22), end_date: de(8)  },
    { subscriber_id: saraId,  trainer_id: TRAINER_ID, plan_id: kickstart.id, status: 'expiring', payment_method: 'tabby', start_date: d(28), end_date: de(2)  },
    { subscriber_id: omarId,  trainer_id: TRAINER_ID, plan_id: kickstart.id, status: 'active',   payment_method: 'tap',   start_date: d(1),  end_date: de(29) },
    { subscriber_id: laylaId, trainer_id: TRAINER_ID, plan_id: transform.id, status: 'expired',  payment_method: 'tap',   start_date: d(92), end_date: d(2)   },
  ]
  for (const row of subRows) {
    const { error } = await sb.from('subscriptions').insert(row)
    if (error) console.warn('Sub insert warn:', error.message)
  }
  const { data: subs } = await sb.from('subscriptions').select('id, subscriber_id').eq('trainer_id', TRAINER_ID)
  if (!subs?.length) { console.error('No subscriptions found after insert'); process.exit(1) }
  console.log('✓ Subscriptions inserted:', subs.length)

  const ahmedSub = subs.find(s => s.subscriber_id === ahmedId)
  const saraSub  = subs.find(s => s.subscriber_id === saraId)
  const omarSub  = subs.find(s => s.subscriber_id === omarId)
  const laylaSub = subs.find(s => s.subscriber_id === laylaId)

  // Build payment / progress rows only for subs that actually exist
  const subMap = { ahmed: ahmedSub, sara: saraSub, omar: omarSub, layla: laylaSub }
  const payRows = [
    ahmedSub && { subscription_id: ahmedSub.id, amount: 299, currency: 'SAR', method: 'tap',   status: 'completed', external_ref: 'chg_test_001' },
    saraSub  && { subscription_id: saraSub.id,  amount: 299, currency: 'SAR', method: 'tabby', status: 'completed', external_ref: 'tabby_test_001' },
    omarSub  && { subscription_id: omarSub.id,  amount: 299, currency: 'SAR', method: 'tap',   status: 'completed', external_ref: 'chg_test_002' },
    laylaSub && { subscription_id: laylaSub.id, amount: 799, currency: 'SAR', method: 'tap',   status: 'completed', external_ref: 'chg_test_003' },
  ].filter(Boolean)

  console.log('── Inserting payments...')
  if (payRows.length) {
    const { error: payErr } = await sb.from('payments').insert(payRows)
    if (payErr) console.warn('Payments warn:', payErr.message)
    else console.log('✓ Payments inserted:', payRows.length)
  }

  console.log('── Inserting conversations + messages...')
  const convRows = [
    { subscriber_id: ahmedId, trainer_id: TRAINER_ID, last_message_at: new Date(Date.now() - 2*3600000).toISOString() },
    { subscriber_id: saraId,  trainer_id: TRAINER_ID, last_message_at: new Date(Date.now() - 5*3600000).toISOString() },
    { subscriber_id: omarId,  trainer_id: TRAINER_ID, last_message_at: new Date(Date.now() - 24*3600000).toISOString() },
    { subscriber_id: laylaId, trainer_id: TRAINER_ID, last_message_at: new Date(Date.now() - 2*24*3600000).toISOString() },
  ]
  const { data: convs } = await sb.from('conversations').insert(convRows).select()

  if (convs?.length) {
    const msgRows = []
    for (const conv of convs) {
      if (conv.subscriber_id === ahmedId) {
        msgRows.push(
          { conversation_id: conv.id, sender_id: ahmedId,            content: 'Coach, just finished chest session. 4 sets at 80kg!', read: true,  created_at: new Date(Date.now()-3*3600000).toISOString() },
          { conversation_id: conv.id, sender_id: TRAINER_PROFILE_ID, content: 'Excellent work Ahmed! How did the last set feel?',     read: true,  created_at: new Date(Date.now()-2.5*3600000).toISOString() },
          { conversation_id: conv.id, sender_id: ahmedId,            content: 'Felt strong too 💪',                                   read: false, created_at: new Date(Date.now()-2*3600000).toISOString() },
        )
      } else if (conv.subscriber_id === saraId) {
        msgRows.push({ conversation_id: conv.id, sender_id: saraId, content: 'Thank you for the update coach!', read: true, created_at: new Date(Date.now()-5*3600000).toISOString() })
      } else if (conv.subscriber_id === omarId) {
        msgRows.push(
          { conversation_id: conv.id, sender_id: omarId, content: 'When can I start? 🔥',            read: false, created_at: new Date(Date.now()-24*3600000).toISOString() },
          { conversation_id: conv.id, sender_id: omarId, content: 'Should I do cardio tomorrow?',    read: false, created_at: new Date(Date.now()-23*3600000).toISOString() },
        )
      }
    }
    if (msgRows.length) await sb.from('messages').insert(msgRows)
    console.log('✓ Conversations + messages inserted:', convs.length)
  }

  console.log('── Inserting progress submissions...')
  const progRows = [
    ahmedSub && { subscription_id: ahmedSub.id, subscriber_id: ahmedId, week_number: 2, weight_kg: 87.5, notes: 'Energy is good. Feeling stronger on bench.', reviewed: false, submitted_at: new Date(Date.now()-2*24*3600000).toISOString() },
    ahmedSub && { subscription_id: ahmedSub.id, subscriber_id: ahmedId, week_number: 1, weight_kg: 89.0, notes: 'First week done! Legs are sore.',              reviewed: true,  submitted_at: new Date(Date.now()-9*24*3600000).toISOString() },
    saraSub  && { subscription_id: saraSub.id,  subscriber_id: saraId,  week_number: 4, weight_kg: 68.1, notes: 'Hardest week but I pushed through!',           reviewed: false, submitted_at: new Date(Date.now()-1*24*3600000).toISOString() },
    saraSub  && { subscription_id: saraSub.id,  subscriber_id: saraId,  week_number: 3, weight_kg: 69.5, notes: 'Feeling lighter this week.',                   reviewed: true,  submitted_at: new Date(Date.now()-8*24*3600000).toISOString() },
  ].filter(Boolean)
  if (progRows.length) {
    await sb.from('progress_submissions').insert(progRows)
    console.log('✓ Progress submissions inserted:', progRows.length)
  }

  console.log('── Inserting promo codes...')
  await sb.from('promo_codes').insert([
    { trainer_id: TRAINER_ID, code: 'KHALID20', discount_pct: 20, max_uses: 50, uses_count: 7,  expires_at: new Date(Date.now()+30*24*3600000).toISOString(), active: true },
    { trainer_id: TRAINER_ID, code: 'LOYAL10',  discount_pct: 10, max_uses: null, uses_count: 8, expires_at: null,                                              active: true },
  ])
  console.log('✓ Promo codes inserted')

  console.log('── Updating trainer subscriber count...')
  await sb.from('trainers').update({ subscribers_count: 4 }).eq('id', TRAINER_ID)

  console.log('\n✅ Full seed complete!')
}

run().catch(console.error)
