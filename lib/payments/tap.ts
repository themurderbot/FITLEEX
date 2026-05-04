const TAP_API = 'https://api.tap.company/v2'
const SECRET  = process.env.TAP_SECRET_KEY!

export interface TapChargeParams {
  amount:          number
  currency:        string
  description:     string
  subscriptionId:  string
  customerId:      string
  customerName:    string
  customerEmail:   string
  customerPhone?:  string
  redirectUrl:     string
}

export interface TapCharge {
  id:          string
  status:      string
  transaction: { url: string }
}

export async function createTapCharge(p: TapChargeParams): Promise<TapCharge> {
  const res = await fetch(`${TAP_API}/charges`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount:      p.amount,
      currency:    p.currency,
      description: p.description,
      metadata:    { subscription_id: p.subscriptionId },
      customer: {
        id:    p.customerId,
        name:  [{ lang: 'en', value: p.customerName }],
        email: p.customerEmail,
        phone: p.customerPhone ? { country_code: '966', number: p.customerPhone } : undefined,
      },
      source: { id: 'src_all' },
      post:   { url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/tap` },
      redirect: { url: p.redirectUrl },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Tap error ${res.status}: ${err}`)
  }
  return res.json()
}

export async function retrieveTapCharge(chargeId: string): Promise<TapCharge & { status: string }> {
  const res = await fetch(`${TAP_API}/charges/${chargeId}`, {
    headers: { Authorization: `Bearer ${SECRET}` },
  })
  if (!res.ok) throw new Error(`Tap retrieve error ${res.status}`)
  return res.json()
}
