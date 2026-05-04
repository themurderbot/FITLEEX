import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'
import { getLocale }      from 'next-intl/server'
import { formatDate, formatNumber } from '@/lib/utils'
import { ExportCSVButton } from './ExportCSVButton'

const AV_COLORS = [
  'linear-gradient(135deg,#C8F04B,#7ab82e)',
  'linear-gradient(135deg,#60a5fa,#3b82f6)',
  'linear-gradient(135deg,#FF5A36,#cc3d20)',
  'linear-gradient(135deg,#a78bfa,#7c3aed)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
]

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export const metadata = { title: 'Earnings' }

export default async function EarningsPage() {
  const supabase = await createClient()
  const { data: { user } } = await (supabase as any).auth.getUser()
  if (!user) redirect('/auth/login')

  const locale = await getLocale()

  const { data: trainerRaw } = await (supabase as any)
    .from('trainers')
    .select('id, commission_rate')
    .eq('profile_id', user.id)
    .single()
  if (!trainerRaw) redirect('/')

  const trainer = trainerRaw as any

  // Fetch active subscriber count
  const { count: activeSubCount } = await (supabase as any)
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('trainer_id', trainer.id)
    .in('status', ['active', 'expiring'])

  // Fetch subscription IDs for this trainer
  const { data: trainerSubs } = await (supabase as any)
    .from('subscriptions')
    .select('id, profiles!subscriber_id(full_name), trainer_plans(name)')
    .eq('trainer_id', trainer.id)

  const subIds = (trainerSubs ?? []).map((s: any) => s.id)

  // Fetch payments using subIds array
  const { data: paymentsRaw } = subIds.length > 0
    ? await supabase
        .from('payments')
        .select('id, subscription_id, amount, currency, method, status, created_at')
        .eq('status', 'completed')
        .in('subscription_id', subIds)
        .order('created_at', { ascending: false })
    : { data: [] as any[] }

  const payments = (paymentsRaw ?? []) as any[]

  // Build sub info lookup
  const subInfoMap: Record<string, { subscriber: string; plan: string }> = {}
  ;(trainerSubs ?? []).forEach((s: any) => {
    subInfoMap[s.id] = {
      subscriber: (s.profiles as any)?.full_name ?? '—',
      plan:       (s.trainer_plans as any)?.name ?? '—',
    }
  })

  const methodLabel: Record<string, string> = {
    tap:    locale === 'ar' ? 'بطاقة ائتمان' : 'Credit Card',
    tabby:  'Tabby',
    tamara: 'Tamara',
  }

  const gross          = payments.reduce((s: number, p: any) => s + p.amount, 0)
  const commissionRate = trainer.commission_rate ?? 0.8
  const trainerRevenue = gross * commissionRate
  const trainerPct     = Math.round(commissionRate * 100)
  const platformPct    = 100 - trainerPct

  const statCards = [
    {
      label:  locale === 'ar' ? 'إجمالي الإيرادات' : 'Gross Revenue',
      value:  `AED ${formatNumber(Math.round(gross))}`,
      sub:    locale === 'ar' ? 'إجمالي المدفوعات' : 'Total payments collected',
      color:  '#fff',
    },
    {
      label:  locale === 'ar' ? `حصتك ${trainerPct}%` : `Your Share ${trainerPct}%`,
      value:  `AED ${formatNumber(Math.round(trainerRevenue))}`,
      sub:    locale === 'ar' ? 'صافي أرباحك' : 'Your net earnings',
      color:  '#C8F04B',
    },
    {
      label:  locale === 'ar' ? 'المشتركون النشطون' : 'Active Subscribers',
      value:  formatNumber(activeSubCount ?? 0),
      sub:    locale === 'ar' ? 'نشط أو ينتهي قريباً' : 'Active or expiring soon',
      color:  '#4D9EFF',
    },
  ]

  const csvRows = payments.map((p: any) => {
    const info = subInfoMap[p.subscription_id] ?? { subscriber: '—', plan: '—' }
    return {
      subscriber: info.subscriber,
      plan:       info.plan,
      date:       formatDate(p.created_at),
      amount:     p.amount,
      cut:        Math.round(p.amount * commissionRate),
      method:     methodLabel[p.method] ?? p.method,
    }
  })

  const th = (en: string, ar: string, hidden?: string) => (
    <th className={`text-start py-3 px-4 font-medium text-[10px] tracking-[2px] uppercase${hidden ? ` hidden ${hidden}:table-cell` : ''}`}
      style={{ color: '#444' }}>
      {locale === 'ar' ? ar : en}
    </th>
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-extrabold text-white">
          {locale === 'ar' ? 'الأرباح' : 'Earnings'}
        </h1>
        <p className="text-[11px] font-mono mt-0.5" style={{ color: '#555' }}>
          {locale === 'ar' ? 'ملخص الإيرادات والمدفوعات' : 'Revenue & payment summary'}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="rounded-xl p-4 flex flex-col gap-1"
            style={{ background: '#141414', border: '1px solid #222' }}>
            <p className="text-[10px] font-mono tracking-[2px] uppercase" style={{ color: '#555' }}>{card.label}</p>
            <p className="font-mono text-2xl font-semibold leading-tight" style={{ color: card.color }}>{card.value}</p>
            <p className="text-[11px]" style={{ color: '#555' }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue split bar */}
      <div className="rounded-xl p-5" style={{ background: '#141414', border: '1px solid #222' }}>
        <p className="text-xs font-mono mb-3" style={{ color: '#555' }}>
          {locale === 'ar' ? 'توزيع الإيرادات' : 'Revenue Split'}
        </p>
        <div className="h-3 rounded-full overflow-hidden flex" style={{ background: '#222' }}>
          <div style={{ width: `${trainerPct}%`, background: '#C8F04B', borderRadius: 9999 }} />
        </div>
        <div className="flex justify-between mt-2 text-xs font-mono">
          <span style={{ color: '#C8F04B' }}>{locale === 'ar' ? `أنت ${trainerPct}%` : `You ${trainerPct}%`}</span>
          <span style={{ color: '#555' }}>{locale === 'ar' ? `المنصة ${platformPct}%` : `Platform ${platformPct}%`}</span>
        </div>
      </div>

      {/* Payment history table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #222', background: '#141414' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #222' }}>
          <h2 className="font-semibold text-white text-sm">
            {locale === 'ar' ? 'سجل المدفوعات' : 'Payment History'}
          </h2>
          <ExportCSVButton rows={csvRows} locale={locale} />
        </div>
        {!payments.length ? (
          <p className="text-sm text-center py-10" style={{ color: '#555' }}>
            {locale === 'ar' ? 'لا توجد مدفوعات بعد' : 'No payments yet'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 640 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222' }}>
                  {th('Subscriber', 'المشترك')}
                  {th('Plan', 'الخطة', 'md')}
                  {th('Date', 'التاريخ', 'lg')}
                  {th('Amount', 'المبلغ')}
                  {th('Your Cut', 'حصتك')}
                  {th('Method', 'طريقة الدفع', 'md')}
                  {th('Status', 'الحالة')}
                </tr>
              </thead>
              <tbody>
                {payments.map((p: any, idx: number) => {
                  const info = subInfoMap[p.subscription_id] ?? { subscriber: '—', plan: '—' }
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors"
                      style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div style={{
                            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                            background: AV_COLORS[idx % AV_COLORS.length],
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: 11, color: '#000',
                          }}>
                            {initials(info.subscriber)}
                          </div>
                          <span className="font-medium text-white text-sm">{info.subscriber}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell" style={{ color: '#888' }}>{info.plan}</td>
                      <td className="py-3 px-4 font-mono hidden lg:table-cell" style={{ color: '#666' }}>
                        {formatDate(p.created_at)}
                      </td>
                      <td className="py-3 px-4 font-mono text-white">AED {formatNumber(p.amount)}</td>
                      <td className="py-3 px-4 font-mono font-bold" style={{ color: '#C8F04B' }}>
                        AED {formatNumber(Math.round(p.amount * commissionRate))}
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell" style={{ color: '#888' }}>
                        {methodLabel[p.method] ?? p.method}
                      </td>
                      <td className="py-3 px-4">
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
                          background: 'rgba(200,240,75,0.15)', color: '#C8F04B',
                        }}>
                          {locale === 'ar' ? 'مدفوع' : 'Paid'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
