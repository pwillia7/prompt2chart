import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Providers } from './providers'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

const SITE_URL = 'https://prompt2chart.com'
const TITLE = 'Prompt2Chart - AI-Powered Data Visualizations'
const DESCRIPTION =
  'Turn your data into interactive charts and visualizations with AI. Upload CSV or JSON, describe what you want to see, and get D3.js charts instantly.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }] },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F97316',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Prompt2Chart',
  url: 'https://prompt2chart.com',
  description:
    'Turn your data into interactive charts and visualizations with AI. Upload a CSV, describe what you want to see in plain English, and get interactive D3.js or Vega-Lite charts instantly.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  browserRequirements: 'Requires JavaScript',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: '100 free credits on signup, 25 free credits added every month',
  },
  featureList: [
    'Natural language chart generation',
    'Interactive D3.js charts',
    'Vega-Lite visualizations',
    'CSV and JSON data upload',
    'Export to PNG, SVG, and HTML',
    'AI data analyst and insights',
    'Zoom, pan, brush, and filter interactivity',
  ],
  creator: {
    '@type': 'Organization',
    name: 'Prompt2Chart',
    url: 'https://prompt2chart.com',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Script id="theme-preload" strategy="beforeInteractive">
          {`(function(){var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark');})()`}
        </Script>
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id="2ba65615-111b-46d4-bcf4-c96a926c2b67"
          strategy="afterInteractive"
        />
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
