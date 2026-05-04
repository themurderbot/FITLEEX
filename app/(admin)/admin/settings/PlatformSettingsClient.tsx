'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Setting { key: string; value: string; description?: string }

export function PlatformSettingsClient({ settings, adminId }: { settings: Setting[]; adminId: string }) {
  const t = useTranslations('admin')

  const settingLabel: Record<string, string> = {
    commission_rate:        t('settingCommissionRate'),
    min_subscription_days:  t('settingMinSubDays'),
    max_promo_discount_pct: t('settingMaxPromoDiscount'),
    tabby_enabled:          t('settingTabbyEnabled'),
    tamara_enabled:         t('settingTamaraEnabled'),
    tap_enabled:            t('settingTapEnabled'),
    max_video_size_mb:      t('settingMaxVideoSize'),
    default_currency:       t('settingDefaultCurrency'),
    default_language:       t('settingDefaultLanguage'),
    supported_currencies:   t('settingSupportedCurrencies'),
  }

  const settingDesc: Record<string, string> = {
    commission_rate:        t('settingCommissionRateDesc'),
    min_subscription_days:  t('settingMinSubDaysDesc'),
    max_promo_discount_pct: t('settingMaxPromoDiscountDesc'),
    tabby_enabled:          t('settingTabbyEnabledDesc'),
    tamara_enabled:         t('settingTamaraEnabledDesc'),
    tap_enabled:            t('settingTapEnabledDesc'),
    max_video_size_mb:      t('settingMaxVideoSizeDesc'),
    default_currency:       t('settingDefaultCurrencyDesc'),
    default_language:       t('settingDefaultLanguageDesc'),
    supported_currencies:   t('settingSupportedCurrenciesDesc'),
  }

  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map(s => [s.key, s.value]))
  )
  const [saved, setSaved]         = useState(false)
  const [pending, startTransition] = useTransition()
  const supabase = createClient()

  function handleSave() {
    startTransition(async () => {
      const updates = Object.entries(values).map(([key, value]) =>
        (supabase as any).from('platform_settings').update({ value, updated_by: adminId }).eq('key', key)
      )
      await Promise.all(updates)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[19px] font-extrabold text-white">{t('settingsTitle')}</h1>
        <button onClick={handleSave} disabled={pending} className="btn-brand flex items-center gap-2">
          <Save size={15} />
          {saved ? t('saved') : pending ? t('saving') : t('saveChanges')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {settings.map(s => (
          <div key={s.key} className="card p-4 flex flex-col gap-2">
            <label className="text-sm font-semibold text-white">
              {settingLabel[s.key] ?? s.key}
            </label>
            <p className="text-xs text-muted">
              {settingDesc[s.key] ?? s.description ?? ''}
            </p>
            {s.value === 'true' || s.value === 'false' ? (
              <select
                className="input"
                value={values[s.key]}
                onChange={e => setValues(v => ({ ...v, [s.key]: e.target.value }))}
              >
                <option value="true">{t('enabled')}</option>
                <option value="false">{t('disabled')}</option>
              </select>
            ) : (
              <input
                className="input"
                value={values[s.key] ?? ''}
                onChange={e => setValues(v => ({ ...v, [s.key]: e.target.value }))}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
