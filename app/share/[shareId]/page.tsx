import type { Metadata } from 'next'
import Link from 'next/link'
import { SharedChartInteractive } from './SharedChartInteractive'
import type { SharedChart } from '@/types'

type Params = Promise<{ shareId: string }>

const STATIC_OG_IMAGE = 'https://prompt2chart.com/og-image.png'

function buildDescription(projectName?: string | null): string {
  if (projectName) {
    return `Check out "${projectName}" — a chart I built with Prompt2Chart by typing what I wanted to see from my data.`
  }
  return 'Check out this chart I built with Prompt2Chart — just described what I wanted to see from my data and AI built it instantly.'
}

async function fetchShare(shareId: string): Promise<SharedChart | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return null

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/shared_charts?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } },
    )
    if (!res.ok) return null
    const rows = (await res.json()) as SharedChart[]
    return rows[0] ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { shareId } = await params
  const share = await fetchShare(shareId)

  const displayName = share?.project_name ?? null
  const title = displayName
    ? `${displayName} — Prompt2Chart`
    : share
      ? `${share.prompt} — Prompt2Chart`
      : 'Shared Chart — Prompt2Chart'
  const description = buildDescription(displayName)
  const imageUrl = share?.og_image_url ?? STATIC_OG_IMAGE
  const imageAlt = 'AI-generated data visualization from Prompt2Chart'

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      siteName: 'Prompt2Chart',
      title,
      description,
      images: [{ url: imageUrl, alt: imageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@prompt2chart',
      title,
      description,
      images: [{ url: imageUrl, alt: imageAlt }],
    },
  }
}

export default async function Page({ params }: { params: Params }) {
  const { shareId } = await params
  const share = await fetchShare(shareId)

  if (!share) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-2xl font-bold text-[var(--text)]">Chart not found</h1>
        <p className="text-[var(--text-muted)] text-sm">This share link may have expired or been removed.</p>
        <Link
          href="/"
          className="px-4 py-2 text-sm font-medium rounded-[10px] bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors duration-fast"
        >
          Go to Prompt2Chart
        </Link>
      </div>
    )
  }

  return <SharedChartInteractive shared={share} />
}
