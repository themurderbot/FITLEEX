import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient }        from '@/lib/supabase/server'
import crypto                       from 'crypto'

function verifyTamaraSignature(body: string, signature: string): boolean {
  const secret = process.env.TAMARA_NOTIFICATION_TOKEN ?? ''
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

// Tamara notification webhook
export async function POST(req: NextRequest) {
  const raw       = await req.text()
  const signature = req.headers.get('tamara-signature') ?? ''

  // Verify in production (skip if token not set, e.g. dev)
  if (process.env.TAMARA_NOTIFICATION_TOKEN && !verifyTamaraSignature(raw, signature)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  const body  = JSON.parse(raw)
  const event = body?.event_type  // order_approved | order_declined | payment_captured
  const subId = body?.order_reference_id

  if (!subId) return NextResponse.json({ error: 'missing reference' }, { status: 400 })

  const supabase = await createAdminClient()

  if (event === 'order_approved' || event === 'payment_captured') {
    await (supabase as any).rpc('activate_subscription_on_payment', {
      p_subscription_id: subId,
      p_tap_charge_id:   null,
    })
  } else if (event === 'order_declined') {
    await (supabase as any)
      .from('payments')
      .update({ status: 'failed' })
      .eq('subscription_id', subId)
      .eq('status', 'pending')
  }

  return NextResponse.json({ received: true })
}
