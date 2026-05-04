'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ─── Schemas ──────────────────────────────────────────────────

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
})

const SubscriberSignupSchema = z.object({
  full_name: z.string().min(2),
  email:     z.string().email(),
  password:  z.string().min(8),
  country:   z.string().min(2),
  language:  z.enum(['ar', 'en']),
})

const TrainerSignupSchema = z.object({
  full_name:        z.string().min(2),
  email:            z.string().email(),
  password:         z.string().min(8),
  country:          z.string().min(2),
  language:         z.enum(['ar', 'en']),
  specialty:        z.string().min(2),
  bio:              z.string().optional().default(''),
  years_experience: z.coerce.number().min(0).max(50).optional().default(0),
})

// ─── Result type ──────────────────────────────────────────────

export type ActionResult =
  | { success: true; dest?: string }
  | { success: false; error: string }

// ─── Login ────────────────────────────────────────────────────

export async function login(formData: FormData): Promise<ActionResult> {
  const raw = {
    email:    formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = LoginSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: 'بيانات غير صالحة' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email:    parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  const dest = (profile as any)?.role === 'admin'   ? '/admin/overview'
             : (profile as any)?.role === 'trainer' ? '/trainer/dashboard'
             : '/dashboard'

  return { success: true, dest }
}

// ─── Subscriber Signup ────────────────────────────────────────

export async function signupSubscriber(formData: FormData): Promise<ActionResult> {
  const raw = {
    full_name: formData.get('full_name'),
    email:     formData.get('email'),
    password:  formData.get('password'),
    country:   formData.get('country'),
    language:  formData.get('language'),
  }

  const parsed = SubscriberSignupSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: 'يرجى التحقق من البيانات المدخلة' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email:    parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        role:      'subscriber',
        full_name: parsed.data.full_name,
        country:   parsed.data.country,
        language:  parsed.data.language,
      },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { success: false, error: 'هذا البريد الإلكتروني مسجل بالفعل' }
    }
    return { success: false, error: 'حدث خطأ، يرجى المحاولة مجدداً' }
  }

  redirect('/')
}

// ─── Trainer Signup ───────────────────────────────────────────

export async function signupTrainer(formData: FormData): Promise<ActionResult> {
  const raw = {
    full_name:        formData.get('full_name'),
    email:            formData.get('email'),
    password:         formData.get('password'),
    country:          formData.get('country'),
    language:         formData.get('language'),
    specialty:        formData.get('specialty'),
    bio:              formData.get('bio'),
    years_experience: formData.get('years_experience'),
  }

  const parsed = TrainerSignupSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: 'يرجى التحقق من جميع الحقول' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email:    parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        role:             'trainer',
        full_name:        parsed.data.full_name,
        country:          parsed.data.country,
        language:         parsed.data.language,
        specialty:        parsed.data.specialty,
        bio:              parsed.data.bio,
        years_experience: parsed.data.years_experience,
      },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { success: false, error: 'هذا البريد الإلكتروني مسجل بالفعل' }
    }
    return { success: false, error: 'حدث خطأ، يرجى المحاولة مجدداً' }
  }

  return { success: true }
}

// ─── Upload Trainer Document ──────────────────────────────────

export async function uploadTrainerDocument(
  formData: FormData
): Promise<ActionResult & { url?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'غير مصادق' }

  const file    = formData.get('file') as File
  const docType = formData.get('type') as string

  if (!file || file.size === 0) {
    return { success: false, error: 'يرجى اختيار ملف' }
  }

  const { data: trainer } = await (supabase as any)
    .from('trainers')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!trainer) return { success: false, error: 'لم يتم العثور على المدرب' }

  const ext  = file.name.split('.').pop()
  const path = `${(trainer as any).id}/${docType}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('trainer-documents')
    .upload(path, file, { upsert: true })

  if (uploadError) {
    return { success: false, error: 'فشل رفع الملف' }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('trainer-documents')
    .getPublicUrl(path)

  await (supabase as any).from('trainer_documents').insert({
    trainer_id: (trainer as any).id,
    type:       docType as 'id' | 'cert' | 'photo',
    url:        publicUrl,
    verified:   false,
  })

  return { success: true, url: publicUrl }
}

// ─── Set Language ─────────────────────────────────────────────

export async function setLanguage(lang: 'ar' | 'en') {
  const cookieStore = await cookies()
  cookieStore.set('FITLEEX_LANG', lang, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await (supabase as any).from('profiles').update({ language: lang }).eq('id', user.id)
  }
}

// ─── Logout ───────────────────────────────────────────────────

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
