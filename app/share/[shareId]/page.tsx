import type { Metadata } from 'next'
import { SharedChartPage } from '@/views/SharedChartPage'

type Params = Promise<{ shareId: string }>

const STATIC_OG_IMAGE = 'https://prompt2chart.com/og-image.png'

interface ShareRow {
  prompt: string
  project_name: string | null
  og_image_url: string | null
}

function buildDescription(projectName?: string): string {
  if (projectName) {
    return `Check out "${projectName}" — a chart I built with Prompt2Chart by typing what I wanted to see from my data.`
  }
  return 'Check out this chart I built with Prompt2Chart — just described what I wanted to see from my data and AI built it instantly.'
}

async function fetchShare(shareId: string): Promise<ShareRow | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return null

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/shared_charts?id=eq.${encodeURIComponent(shareId)}&select=prompt,project_name,og_image_url&limit=1`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    )
    if (!res.ok) return null
    const rows = (await res.json()) as ShareRow[]
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
  const description = buildDescription(displayName ?? undefined)
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

export default function Page() {
  return <SharedChartPage />
}
