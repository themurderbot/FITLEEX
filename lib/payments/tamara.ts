const TAMARA_API = 'https://api.tamara.co'
const TOKEN      = process.env.TAMARA_API_TOKEN!

export interface TamaraSessionParams {
  amount:          number
  currency:        string
  description:     string
  subscriptionId:  string
  customerName:    string
  customerEmail:   string
  customerPhone:   string
  successUrl:      string
  cancelUrl:       string
  failureUrl:      string
  notificationUrl: string
}

export interface TamaraSession {
  checkout_id:  string
  checkout_url: string
}

export async function createTamaraSession(p: TamaraSessionParams): Promise<TamaraSession> {
  const res = await fetch(`${TAMARA_API}/checkout`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      order_reference_id: p.subscriptionId,
      total_amount: { amount: String(p.amount.toFixed(2)), currency: p.currency },
      description:  p.description,
      country_code: 'SA',
      payment_type: 'PAY_BY_INSTALMENTS',
      instalments:  3,
      customer: {
        first_name: p.customerName.split(' ')[0],
        last_name:  p.customerName.split(' ').slice(1).join(' ') || p.customerName.split(' ')[0],
        email:      p.customerEmail,
        phone_number: p.customerPhone,
      },
      items: [{
        reference_id: p.subscriptionId,
        name:         p.description,
        sku:          'subscription',
        type:         'Digital',
        unit_price:   { amount: String(p.amount.toFixed(2)), currency: p.currency },
        discount_amount: { amount: '0.00', currency: p.currency },
        tax_amount:   { amount: '0.00', currency: p.currency },
        total_amount: { amount: String(p.amount.toFixed(2)), currency: p.currency },
        quantity:     1,
      }],
      discount:         { amount: { amount: '0.00', currency: p.currency }, name: '' },
      tax_amount:       { amount: '0.00', currency: p.currency },
      shipping_amount:  { amount: '0.00', currency: p.currency },
      merchant_url: {
        success:      p.successUrl,
        failure:      p.failureUrl,
        cancel:       p.cancelUrl,
        notification: p.notificationUrl,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Tamara error ${res.status}: ${err}`)
  }
  return res.json()
}
