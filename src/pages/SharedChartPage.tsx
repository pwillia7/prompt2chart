import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { D3ChartRenderer, D3ChartHandle } from '../components/charts/D3ChartRenderer'
import { ChartRenderer, VegaChartHandle } from '../components/charts/ChartRenderer'
import { Spinner } from '../components/ui/Spinner'
import { supabase } from '../lib/supabase'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { track } from '../lib/analytics'
import type { SharedChart } from '../types'

export function SharedChartPage() {
  const { shareId } = useParams<{ shareId: string }>()
  const [shared, setShared] = useState<SharedChart | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const d3Ref = useRef<D3ChartHandle>(null)
  const vegaRef = useRef<VegaChartHandle>(null)

  useDocumentTitle(shared ? `${shared.prompt} — Prompt2Chart` : 'Shared Chart — Prompt2Chart')

  useEffect(() => {
    if (!shareId) return
    let cancelled = false

    async function load() {
      const { data, error } = await supabase
        .from('shared_charts')
        .select('*')
        .eq('id', shareId)
        .single()

      if (cancelled) return

      if (error || !data) {
        setNotFound(true)
      } else {
        setShared(data as SharedChart)
        track('share-viewed', { library: (data as SharedChart).chart_library })
      }
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [shareId])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (notFound || !shared) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-2xl font-bold text-[var(--text)]">Chart not found</h1>
        <p className="text-[var(--text-muted)] text-sm">This share link may have expired or been removed.</p>
        <Link
          to="/"
          className="px-4 py-2 text-sm font-medium rounded-[10px] bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors duration-fast"
        >
          Go to Prompt2Chart
        </Link>
      </div>
    )
  }

  const data = (shared.data_snapshot as unknown[]) ?? []

  return (
    <div className="min-h-screen bg-bg pb-20">
      {/* Minimal header */}
      <header className="border-b border-[var(--border)] bg-[var(--surface-1)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <svg className="w-7 h-7" viewBox="0 0 100 100">
              <rect x="10" y="60" width="15" height="30" fill="#FDBA74" />
              <rect x="30" y="40" width="15" height="50" fill="#FB923C" />
              <rect x="50" y="20" width="15" height="70" fill="#F97316" />
              <rect x="70" y="35" width="15" height="55" fill="#EA580C" />
            </svg>
            <span className="font-semibold text-[var(--text)] text-sm">Prompt2Chart</span>
          </Link>
          <Link
            to="/signup"
            onClick={() => track('share-cta-header-click', {})}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[10px] bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors duration-fast"
          >
            Try it free
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Prompt title */}
        <div>
          <p className="text-xs font-medium text-[var(--text-subtle)] uppercase tracking-wider mb-1">Chart prompt</p>
          <h1 className="text-xl font-semibold text-[var(--text)] leading-snug">{shared.prompt}</h1>
        </div>

        {/* Chart card */}
        <div className="bg-[var(--surface-1)] rounded-card border border-[var(--border)] p-6">
          {shared.chart_library === 'd3' && shared.d3_code ? (
            <D3ChartRenderer
              ref={d3Ref}
              code={shared.d3_code}
              data={data}
              onRetry={() => {}}
              onRenderError={() => {}}
              onRenderSuccess={() => {}}
              creditRefunded={false}
            />
          ) : shared.vega_spec_json ? (
            <ChartRenderer
              ref={vegaRef}
              spec={shared.vega_spec_json}
              data={data.length > 0 ? data : undefined}
              onRetry={() => {}}
              onRenderError={() => {}}
              onRenderSuccess={() => {}}
              creditRefunded={false}
            />
          ) : (
            <p className="text-center text-[var(--text-subtle)] py-8">Unable to render chart.</p>
          )}
        </div>

        {/* Explanation */}
        {shared.explanation && (
          <div className="bg-[var(--surface-1)] rounded-card border border-[var(--border)] p-5">
            <p className="text-xs font-medium text-[var(--text-subtle)] uppercase tracking-wider mb-2">About this chart</p>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">{shared.explanation}</p>
          </div>
        )}

        {/* Mid-page CTA */}
        <div className="rounded-card border border-[var(--border)] bg-gradient-to-br from-[var(--surface-1)] to-[var(--surface-2)] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-[var(--text)]">Generate charts from your own data</p>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">Upload a CSV or JSON file and describe what you want to see. 100 free charts, no credit card required.</p>
          </div>
          <Link
            to="/signup"
            onClick={() => track('share-cta-midpage-click', {})}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-[10px] bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors duration-fast whitespace-nowrap"
          >
            Start for free
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </main>

      {/* Sticky bottom conversion bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface-1)] border-t border-[var(--border)] shadow-medium">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-muted)] min-w-0 truncate">
            <span className="hidden sm:inline">Made with </span>
            <span className="font-semibold text-[var(--text)]">Prompt2Chart</span>
            <span className="hidden sm:inline"> — turn your data into charts with AI</span>
          </p>
          <Link
            to="/signup"
            onClick={() => track('share-cta-sticky-click', {})}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-[10px] bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors duration-fast"
          >
            Sign up free
          </Link>
        </div>
      </div>
    </div>
  )
}
