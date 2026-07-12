import { cacheLife, cacheTag } from 'next/cache'
import Link from 'next/link'
import { SharedChartInteractive } from './SharedChartInteractive'
import type { SharedChart } from '@/types'

type Params = Promise<{ shareId: string }>

async function fetchShare(shareId: string): Promise<SharedChart | null> {
  'use cache'
  cacheLife('days')
  cacheTag(`share-${shareId}`)

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
