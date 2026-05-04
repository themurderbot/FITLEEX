import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient }        from '@/lib/supabase/server'

// Tabby webhook: https://docs.tabby.ai/docs/webhooks
export async function POST(req: NextRequest) {
  const body = await req.json()

  const event = body?.event  // payment.authorized | payment.closed | payment.expired
  const subId = body?.meta?.order_id

  if (!subId) return NextResponse.json({ error: 'missing order_id' }, { status: 400 })

  const supabase = await createAdminClient()

  if (event === 'payment.authorized' || event === 'payment.closed') {
    await (supabase as any).rpc('activate_subscription_on_payment', {
      p_subscription_id: subId,
      p_tap_charge_id:   null,
    })
  } else if (event === 'payment.expired') {
    await (supabase as any)
      .from('payments')
      .update({ status: 'failed' })
      .eq('subscription_id', subId)
      .eq('status', 'pending')
  }

  return NextResponse.json({ received: true })
}
