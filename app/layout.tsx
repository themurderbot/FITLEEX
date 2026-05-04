import type { Metadata } from 'next'
import { DM_Sans, Bebas_Neue, DM_Mono, Bricolage_Grotesque } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import { Toaster } from 'sonner'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

const dmMono = DM_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-mono',
  display: 'swap',
})

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
  axes: ['opsz'],
})

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('footer')
  return {
    title: { default: 'FITLEEX', template: '%s | FITLEEX' },
    description: t('description'),
    metadataBase: new URL('https://FITLEEX.com'),
    openGraph: {
      siteName: 'FITLEEX',
      type: 'website',
    },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${dmSans.variable} ${bebasNeue.variable} ${dmMono.variable} ${bricolage.variable} dark`}
    >
      <body className="font-sans bg-background text-foreground antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster
            position={dir === 'rtl' ? 'bottom-right' : 'bottom-left'}
            theme="dark"
            toastOptions={{
              style: {
                background: '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff',
              },
            }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
