import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PromoCodesClient } from './PromoCodesClient'

export const metadata = { title: 'Promo Codes' }

export default async function PromoCodesPage() {
  const supabase = await createClient()
  const { data: { user } } = await (supabase as any).auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: trainer } = await (supabase as any)
    .from('trainers').select('id').eq('profile_id', user.id).single()
  if (!trainer) redirect('/')

  const { data: codes } = await (supabase as any)
    .from('promo_codes')
    .select('*')
    .eq('trainer_id', trainer.id)
    .order('created_at', { ascending: false })

  return <PromoCodesClient trainerId={trainer.id} initialCodes={codes ?? []} />
}
