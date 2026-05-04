const TABBY_API = 'https://api.tabby.ai/api/v2'
const SECRET    = process.env.TABBY_SECRET_KEY!

export interface TabbySessionParams {
  amount:           number
  currency:         string
  description:      string
  subscriptionId:   string
  customerName:     string
  customerEmail:    string
  customerPhone:    string
  successUrl:       string
  cancelUrl:        string
  failureUrl:       string
}

export interface TabbySession {
  id:              string
  configuration:   { available_products: { installments?: { web_url: string }[] } }
}

export async function createTabbySession(p: TabbySessionParams): Promise<string> {
  const res = await fetch(`${TABBY_API}/checkout`, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payment: {
        amount:      String(p.amount.toFixed(2)),
        currency:    p.currency,
        description: p.description,
        buyer: {
          name:  p.customerName,
          email: p.customerEmail,
          phone: p.customerPhone,
        },
        order: {
          reference_id: p.subscriptionId,
          items: [{
            title:      p.description,
            quantity:   1,
            unit_price: String(p.amount.toFixed(2)),
          }],
        },
        buyer_history:  { registered_since: new Date().toISOString(), loyalty_level: 0 },
        order_history:  [],
      },
      lang:           'ar',
      merchant_code:  process.env.TABBY_MERCHANT_CODE,
      merchant_urls: {
        success: p.successUrl,
        cancel:  p.cancelUrl,
        failure: p.failureUrl,
      },
      meta: { order_id: p.subscriptionId },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Tabby error ${res.status}: ${err}`)
  }

  const data: TabbySession = await res.json()
  const url = data.configuration.available_products.installments?.[0]?.web_url
  if (!url) throw new Error('Tabby installments not available for this order')
  return url
}
