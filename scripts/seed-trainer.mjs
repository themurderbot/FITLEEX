// Run: node scripts/seed-trainer.mjs
// Creates a test trainer account on the cloud Supabase project

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mtvqixmrisimtlbrpzkd.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10dnFpeG1yaXNpbXRsYnJwemtkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzAyMjY1NCwiZXhwIjoyMDkyNTk4NjU0fQ.gjbonqfS_iFldZYQt42hvv4svt0d3K1fGQWbp7okYMo'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const TRAINER_EMAIL    = 'khalid@fitfeez.com'
const TRAINER_PASSWORD = 'Fitfeez123!'

async function run() {
  console.log('── Creating trainer auth user...')

  // 1. Create auth user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: TRAINER_EMAIL,
    password: TRAINER_PASSWORD,
    email_confirm: true,
    user_metadata: {
      role: 'trainer',
      full_name: 'Khalid Al-Harbi',
      country: 'SA',
      language: 'ar',
    },
  })

  if (authErr && !authErr.message.includes('already been registered')) {
    console.error('Auth error:', authErr.message)
    process.exit(1)
  }

  const userId = authData?.user?.id
  if (!userId) {
    // user already exists — fetch id
    const { data: existing } = await supabase.auth.admin.listUsers()
    const found = existing?.users?.find(u => u.email === TRAINER_EMAIL)
    if (!found) { console.error('Could not find existing user'); process.exit(1) }
    console.log('ℹ️  Auth user already exists:', found.id)
    await seedProfile(found.id)
    return
  }

  console.log('✓ Auth user created:', userId)
  await seedProfile(userId)
}

async function seedProfile(userId) {
  console.log('── Upserting profile...')
  const { error: profErr } = await supabase.from('profiles').upsert({
    id: userId,
    role: 'trainer',
    full_name: 'Khalid Al-Harbi',
    country: 'SA',
    language: 'ar',
  }, { onConflict: 'id' })
  if (profErr) console.error('Profile error:', profErr.message)
  else console.log('✓ Profile upserted')

  console.log('── Upserting trainer record...')
  const { data: trainerRow, error: trErr } = await supabase
    .from('trainers')
    .upsert({
      profile_id: userId,
      specialty: 'Weight Loss & Muscle Gain',
      bio: '7 years coaching experience, NASM certified. Helped 200+ clients transform their bodies.',
      bio_ar: '٧ سنوات خبرة في التدريب، معتمد من NASM. ساعدت أكثر من ٢٠٠ عميل في تحقيق أهدافهم.',
      years_experience: 7,
      approval_status: 'approved',
      rating: 4.9,
      rating_count: 128,
      subscribers_count: 2,
      is_featured: true,
    }, { onConflict: 'profile_id' })
    .select('id')
    .single()

  if (trErr) { console.error('Trainer error:', trErr.message); process.exit(1) }
  const trainerId = trainerRow.id
  console.log('✓ Trainer record upserted:', trainerId)

  console.log('── Upserting trainer plans...')
  const { error: plErr } = await supabase.from('trainer_plans').upsert([
    {
      trainer_id: trainerId,
      name: 'Kickstart (30 days)',
      name_ar: 'انطلاق (٣٠ يوم)',
      duration_days: 30,
      price: 299,
      currency: 'SAR',
      active: true,
    },
    {
      trainer_id: trainerId,
      name: 'Transform (90 days)',
      name_ar: 'تحول (٩٠ يوم)',
      duration_days: 90,
      price: 799,
      currency: 'SAR',
      active: true,
    },
  ], { onConflict: 'trainer_id,name' })
  if (plErr) console.error('Plans error:', plErr.message)
  else console.log('✓ Trainer plans upserted')

  console.log('\n✅ Done!')
  console.log('   Email   :', TRAINER_EMAIL)
  console.log('   Password:', TRAINER_PASSWORD)
  console.log('   Login at: http://localhost:3002/auth/login')
}

run().catch(console.error)
