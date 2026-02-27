import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { D3ChartRenderer, D3ChartHandle } from '../components/charts/D3ChartRenderer'
import { ChartRenderer, VegaChartHandle } from '../components/charts/ChartRenderer'
import { Spinner } from '../components/ui/Spinner'
import { supabase } from '../lib/supabase'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { track } from '../lib/analytics'
import {
  copyToClipboard,
  openD3InCodePen,
  openVegaLiteInCodePen,
  d3SvgToString,
  d3SvgToPng,
  vegaToPng,
  vegaToSvg,
  downloadPng,
  downloadSvg,
  downloadHtml,
  buildStandaloneHtmlD3,
  buildStandaloneHtmlVegaLite,
} from '../lib/chartExporter'
import type { SharedChart, VegaLiteSpec } from '../types'

interface ParsedNotes {
  chartInsights: string[]
  dataInsights: string[]
  suggestions: string[]
}

function parseNotes(raw: string): ParsedNotes | null {
  try {
    const parsed = JSON.parse(raw)
    if (parsed.chartInsights && parsed.dataInsights) return parsed as ParsedNotes
  } catch {
    // not JSON
  }
  return null
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-muted)] leading-snug">
          <span className="flex-shrink-0 mt-1.5 w-1 h-1 rounded-full bg-[var(--text-subtle)]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function SharedChartPage() {
  const { shareId } = useParams<{ shareId: string }>()
  const [shared, setShared] = useState<SharedChart | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportToast, setExportToast] = useState<string | null>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const d3Ref = useRef<D3ChartHandle>(null)
  const vegaRef = useRef<VegaChartHandle>(null)

  useDocumentTitle(shared
    ? `${shared.project_name ?? shared.prompt} — Prompt2Chart`
    : 'Shared Chart — Prompt2Chart'
  )

  // Set OG/Twitter meta tags dynamically for JS-capable crawlers (e.g. Twitterbot)
  useEffect(() => {
    if (!shared) return

    function setMeta(nameOrProp: string, content: string, useProp = false) {
      const attr = useProp ? 'property' : 'name'
      let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${nameOrProp}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, nameOrProp)
        document.head.appendChild(el)
      }
      el.content = content
    }

    const title = `${shared.project_name ?? shared.prompt} — Prompt2Chart`
    const description = 'An AI-generated chart made with Prompt2Chart. View the interactive visualization and create your own from your data — free.'

    setMeta('description', description)
    setMeta('og:type', 'website', true)
    setMeta('og:title', title, true)
    setMeta('og:description', description, true)
    setMeta('og:url', window.location.href, true)
    setMeta('og:site_name', 'Prompt2Chart', true)
    setMeta('twitter:title', title)
    setMeta('twitter:description', description)

    const imgAlt = 'AI-generated data visualization from Prompt2Chart'
    setMeta('twitter:card', 'summary_large_image')
    setMeta('og:image:alt', imgAlt, true)
    setMeta('twitter:image:alt', imgAlt)

    if (shared.og_image_url) {
      setMeta('og:image', shared.og_image_url, true)
      setMeta('twitter:image', shared.og_image_url)
    }
    // When no chart PNG, static index.html og:image/twitter:image tags act as fallback
  }, [shared])

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

  // Close export dropdown on outside click
  useEffect(() => {
    if (!exportOpen) return
    function handleClick(e: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [exportOpen])

  // Auto-dismiss export toast
  useEffect(() => {
    if (!exportToast) return
    const t = setTimeout(() => setExportToast(null), 2000)
    return () => clearTimeout(t)
  }, [exportToast])

  async function handleExport(action: 'png' | 'svg' | 'html') {
    if (!shared) return
    setExportOpen(false)
    track('share-export-click', { format: action, library: shared.chart_library })
    const data = (shared.data_snapshot as unknown[]) ?? []
    try {
      if (shared.chart_library === 'd3' && shared.d3_code) {
        const svgEl = d3Ref.current?.getSvgEl()
        const containerEl = d3Ref.current?.getContainerEl() ?? undefined
        if (action === 'png') {
          if (!svgEl) throw new Error('Chart not ready')
          const blob = await d3SvgToPng(svgEl, containerEl)
          downloadPng(blob, 'chart')
          setExportToast('PNG downloaded')
        } else if (action === 'svg') {
          if (!svgEl) throw new Error('Chart not ready')
          const str = d3SvgToString(svgEl, containerEl)
          downloadSvg(str, 'chart')
          setExportToast('SVG downloaded')
        } else if (action === 'html') {
          const html = buildStandaloneHtmlD3(shared.d3_code, data)
          downloadHtml(html, 'chart')
          setExportToast('HTML downloaded')
        }
      } else if (shared.vega_spec_json) {
        const view = vegaRef.current?.getView()
        const spec = shared.vega_spec_json as VegaLiteSpec
        const exportSpec = spec.data && 'values' in spec.data && spec.data.values?.length
          ? spec
          : { ...spec, data: { values: data } }
        if (action === 'png') {
          if (!view) throw new Error('Chart not ready')
          const blob = await vegaToPng(view)
          downloadPng(blob, 'chart')
          setExportToast('PNG downloaded')
        } else if (action === 'svg') {
          if (!view) throw new Error('Chart not ready')
          const str = await vegaToSvg(view)
          downloadSvg(str, 'chart')
          setExportToast('SVG downloaded')
        } else if (action === 'html') {
          const html = buildStandaloneHtmlVegaLite(exportSpec)
          downloadHtml(html, 'chart')
          setExportToast('HTML downloaded')
        }
      }
    } catch (err) {
      setExportToast('Export failed: ' + (err as Error).message)
    }
  }

  async function handleCopyLink() {
    try {
      await copyToClipboard(window.location.href)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
      track('share-copylink-click', {})
    } catch {
      // ignore
    }
  }

  function handleCodePen() {
    if (!shared) return
    const data = (shared.data_snapshot as unknown[]) ?? []
    if (shared.chart_library === 'd3' && shared.d3_code) {
      openD3InCodePen(shared.d3_code, data, shared.prompt)
    } else if (shared.vega_spec_json) {
      const spec = shared.vega_spec_json as VegaLiteSpec
      const exportSpec = spec.data && 'values' in spec.data && spec.data.values?.length
        ? spec
        : { ...spec, data: { values: data } }
      openVegaLiteInCodePen(exportSpec, shared.prompt)
    }
    track('share-codepen-click', { library: shared.chart_library })
  }

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
  const notes = shared.explanation ? parseNotes(shared.explanation) : null
  const pageUrl = window.location.href
  const tweetText = encodeURIComponent(`Check out this chart I made with @prompt2chart: "${shared.prompt}"`)
  const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(pageUrl)}`
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`
  const whatsappText = encodeURIComponent(`Check out this chart: "${shared.prompt}" — ${pageUrl}`)
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`
  const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(shared.prompt)}`
  const blueskyText = encodeURIComponent(`Check out this chart I made with Prompt2Chart: "${shared.prompt}" ${pageUrl}`)
  const blueskyUrl = `https://bsky.app/intent/compose?text=${blueskyText}`

  const btnBase = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[10px] bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border-strong)] hover:bg-[var(--surface-3)] transition-colors duration-fast'

  return (
    <div className="min-h-screen bg-bg pb-20">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--surface-1)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <svg className="w-7 h-7" viewBox="0 0 100 100">
              <rect x="10" y="60" width="15" height="30" fill="#FDBA74" />
              <rect x="30" y="40" width="15" height="50" fill="#FB923C" />
              <rect x="50" y="20" width="15" height="70" fill="#F97316" />
              <rect x="70" y="35" width="15" height="55" fill="#EA580C" />
            </svg>
            <span className="text-lg font-semibold text-[var(--text)]">Prompt2Chart</span>
          </Link>
          <Link
            to="/signup"
            onClick={() => track('share-cta-header-click', {})}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[10px] bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors duration-fast"
          >
            Try free
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">

        {/* Project name title */}
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)] leading-tight">
            {shared.project_name ?? shared.prompt}
          </h1>
          {/* Library badge inline with title when no project name (prompt is the title) */}
          {!shared.project_name && (
            <span className={`shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${
              shared.chart_library === 'd3'
                ? 'bg-orange-500/15 text-orange-400'
                : 'bg-[var(--surface-3)] text-[var(--text-muted)]'
            }`}>
              {shared.chart_library === 'd3' ? 'D3.js' : 'Vega-Lite'}
            </span>
          )}
        </div>

        {/* Chart card */}
        <div className="bg-[var(--surface-1)] rounded-card border border-[var(--border)] p-6 max-w-[820px]">
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

        {/* Action bar — share row, then code/export row below */}
        <div className="flex flex-col gap-2">
          {/* Share row */}
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handleCopyLink} className={btnBase}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {linkCopied ? 'Copied!' : 'Copy link'}
            </button>

            <a href={tweetUrl} target="_blank" rel="noopener noreferrer" onClick={() => track('share-twitter-click', {})} className={btnBase}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.836L2.25 2.25h6.907l4.258 5.627zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Post on X
            </a>

            <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" onClick={() => track('share-linkedin-click', {})} className={btnBase}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </a>

            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => track('share-whatsapp-click', {})} className={btnBase}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>

            <a href={redditUrl} target="_blank" rel="noopener noreferrer" onClick={() => track('share-reddit-click', {})} className={btnBase}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
              </svg>
              Reddit
            </a>

            <a href={blueskyUrl} target="_blank" rel="noopener noreferrer" onClick={() => track('share-bluesky-click', {})} className={btnBase}>
              <svg className="w-4 h-4" viewBox="0 0 568 501" fill="currentColor">
                <path d="M123.121 33.664C188.241 82.553 258.281 181.68 284 234.873c25.719-53.192 95.759-152.32 160.879-201.209C491.866-1.611 568-28.906 568 57.947c0 17.346-9.945 145.713-15.778 166.555-20.275 72.453-94.155 90.933-159.875 79.748C507.222 328.795 536.444 394.112 484.888 459.43c-96.607 124.206-138.469-31.126-149.489-70.951-2.041-7.543-3.013-11.103-3.399-11.206-.386.103-1.358 3.663-3.399 11.206-11.02 39.825-52.882 195.157-149.489 70.951-51.556-65.318-22.334-130.635 92.654-155.18-65.72 11.185-139.6-7.295-159.875-79.748C105.945 203.66 96 75.293 96 57.947c0-86.853 76.134-59.558 27.121-24.283z" />
              </svg>
              Bluesky
            </a>
          </div>

          {/* Code/export row — left-aligned below share row */}
          <div className="flex items-center gap-2">
            <div ref={exportMenuRef} className="relative">
              <button
                onClick={() => setExportOpen(o => !o)}
                className={btnBase}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {exportOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-[var(--surface-1)] rounded-card border border-[var(--border)] shadow-medium z-50 py-1">
                  <button onClick={() => handleExport('png')} className="w-full text-left px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] flex items-center gap-2 transition-colors duration-fast">
                    <svg className="w-4 h-4 text-[var(--text-subtle)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    PNG Image
                  </button>
                  <button onClick={() => handleExport('svg')} className="w-full text-left px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] flex items-center gap-2 transition-colors duration-fast">
                    <svg className="w-4 h-4 text-[var(--text-subtle)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    SVG Vector
                  </button>
                  <button onClick={() => handleExport('html')} className="w-full text-left px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] flex items-center gap-2 transition-colors duration-fast">
                    <svg className="w-4 h-4 text-[var(--text-subtle)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    Download HTML
                  </button>
                </div>
              )}

              {exportToast && (
                <div className="absolute right-0 mt-2 px-3 py-2 bg-[var(--surface-1)] text-[var(--text)] text-sm rounded-card shadow-medium border border-[var(--border)] whitespace-nowrap z-50">
                  {exportToast}
                </div>
              )}
            </div>

            <button onClick={handleCodePen} className={btnBase}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.21 12L6.88 12.89V11.11L8.21 12zm2.79 1.84V16l-3.48-2.32 1.46-.97 2.02 1.13zm.5-3.68L8.56 8.5l2.94-1.96v2.18l-2.02 1.13 1.52 1.01v.3zM12 10.74L10.27 12 12 13.26 13.73 12 12 10.74zM22 12c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10zm-3.5-1.3l-.01-.02-5.99-4V6.5L12 6.34l-.5.16v.18l-5.99 4-.01.02-.5.33v2.94l.5.33.01.02 5.99 4v.18l.5.16.5-.16v-.18l5.99-4 .01-.02.5-.33V11.03l-.5-.33zm-5.5 5.12V18l3.48-2.32-1.46-.97-2.02 1.11zm3.32-3.93L17.78 12l-1.46-.89v1.78l-1.5.04z" />
              </svg>
              CodePen
            </button>
          </div>
        </div>

        {/* Prompt callout — shown after the chart so it doesn't delay seeing the viz */}
        {shared.project_name && (
          <div className="flex items-start gap-3 border-l-2 border-[var(--primary)] bg-[var(--surface-2)] rounded-r-card pl-4 pr-4 py-3 max-w-[820px]">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider mb-1">Prompt used</p>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">{shared.prompt}</p>
            </div>
            <span className={`shrink-0 mt-0.5 px-2 py-0.5 text-xs font-medium rounded-full ${
              shared.chart_library === 'd3'
                ? 'bg-orange-500/15 text-orange-400'
                : 'bg-[var(--surface-3)] text-[var(--text-muted)]'
            }`}>
              {shared.chart_library === 'd3' ? 'D3.js' : 'Vega-Lite'}
            </span>
          </div>
        )}

        {/* About this chart */}
        {shared.explanation && (
          <div className="bg-[var(--surface-1)] rounded-card border border-[var(--border)] p-5 space-y-4 max-w-[820px]">
            <p className="text-xs font-medium text-[var(--text-subtle)] uppercase tracking-wider">About this chart</p>
            {notes ? (
              <div className="space-y-4">
                {notes.chartInsights.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Chart Insights</p>
                    <BulletList items={notes.chartInsights} />
                  </div>
                )}
                {notes.dataInsights.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Dataset Insights</p>
                    <BulletList items={notes.dataInsights} />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">{shared.explanation}</p>
            )}
          </div>
        )}

        {/* Conversion CTA */}
        <div className="rounded-card border border-[var(--primary)]/30 bg-gradient-to-br from-[var(--primary)]/5 to-[var(--surface-2)] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div>
              <p className="text-base font-semibold text-[var(--text)]">Want to make charts like this from your own data?</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">Upload a CSV or JSON file, describe what you want to see, and get an interactive chart in seconds. 100 free charts — no credit card needed.</p>
              <div className="flex flex-wrap gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <svg className="w-3.5 h-3.5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  D3.js &amp; Vega-Lite charts
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <svg className="w-3.5 h-3.5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Export PNG, SVG, HTML
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <svg className="w-3.5 h-3.5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Free to start
                </span>
              </div>
            </div>
            <Link
              to="/signup"
              onClick={() => track('share-cta-midpage-click', {})}
              className="shrink-0 inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-[10px] bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors duration-fast whitespace-nowrap shadow-sm"
            >
              Start for free
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </main>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface-1)]/95 backdrop-blur-sm border-t border-[var(--border)] shadow-medium">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-muted)] min-w-0 truncate">
            <span className="font-medium text-[var(--text)]">Prompt2Chart</span>
            <span className="hidden sm:inline text-[var(--text-subtle)]"> — create AI charts from your own data</span>
          </p>
          <Link
            to="/signup"
            onClick={() => track('share-cta-sticky-click', {})}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-[10px] bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors duration-fast"
          >
            Start for free
          </Link>
        </div>
      </div>
    </div>
  )
}
