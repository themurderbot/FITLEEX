import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient }        from '@/lib/supabase/server'

// Tap sends webhook as POST with JSON body
export async function POST(req: NextRequest) {
  const body = await req.json()

  const chargeId = body?.id
  const status   = body?.status   // CAPTURED | FAILED | ABANDONED | VOID
  const subId    = body?.metadata?.subscription_id

  if (!chargeId || !subId) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  if (status === 'CAPTURED') {
    // Activate subscription
    await (supabase as any).rpc('activate_subscription_on_payment', {
      p_subscription_id: subId,
      p_tap_charge_id:   chargeId,
    })
  } else {
    // Mark payment failed
    await (supabase as any)
      .from('payments')
      .update({ status: 'failed' })
      .eq('subscription_id', subId)
      .eq('tap_charge_id', chargeId)
  }

  return NextResponse.json({ received: true })
}
