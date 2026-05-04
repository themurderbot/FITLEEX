'use client'

interface Row {
  subscriber: string
  plan: string
  date: string
  amount: number
  cut: number
  method: string
}

export function ExportCSVButton({ rows, locale }: { rows: Row[]; locale: string }) {
  function download() {
    const header = locale === 'ar'
      ? 'المشترك,الخطة,التاريخ,المبلغ,حصتك,طريقة الدفع'
      : 'Subscriber,Plan,Date,Amount,Your Cut,Method'
    const csv = [header, ...rows.map(r =>
      `"${r.subscriber}","${r.plan}","${r.date}",${r.amount},${r.cut},"${r.method}"`
    )].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `earnings-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={download}
      className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10"
      style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888' }}
    >
      {locale === 'ar' ? 'تصدير CSV' : 'Export CSV'}
    </button>
  )
}
