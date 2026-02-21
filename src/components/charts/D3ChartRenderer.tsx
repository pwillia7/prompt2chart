import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import * as d3 from 'd3'
import { Spinner } from '../ui/Spinner'

export interface D3ChartHandle {
  getContainerEl(): HTMLDivElement | null
  getSvgEl(): SVGSVGElement | null
}

interface D3ChartRendererProps {
  code: string
  data: unknown[]
  className?: string
  onRetry?: () => void
  onRenderError?: (error: string) => void
  onRenderSuccess?: () => void
  creditRefunded?: boolean
}

export const D3ChartRenderer = forwardRef<D3ChartHandle, D3ChartRendererProps>(function D3ChartRenderer({ code, data, className = '', onRetry, onRenderError, onRenderSuccess, creditRefunded }, ref) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useImperativeHandle(ref, () => ({
    getContainerEl: () => containerRef.current,
    getSvgEl: () => containerRef.current?.querySelector('svg') ?? null,
  }))

  useEffect(() => {
    if (!containerRef.current || !code) return

    let isMounted = true

    setLoading(true)
    setError(null)

    // Clear previous content and reset inline styles from prior render.
    // Reset color to #000 (not '') so SVG elements get black as the default
    // currentColor — clearing to '' would inherit the site's grey text color.
    const container = containerRef.current
    d3.select(container).selectAll('*').remove()
    container.style.backgroundColor = ''
    container.style.color = '#000'

    // Validate data
    if (!Array.isArray(data) || data.length === 0) {
      if (isMounted) {
        setError('No data available to render chart')
        setLoading(false)
      }
      return () => { isMounted = false }
    }

    try {
      const width = 700
      const height = 450
      const margin = { top: 40, right: 40, bottom: 60, left: 60 }

      // Wrap d3 in a Proxy to catch access to unavailable plugins
      // and give clear errors instead of "Cannot read properties of undefined"
      const UNAVAILABLE_PLUGINS = new Set([
        'annotation', 'legend', 'tip', 'hexbin', 'cloud',
        'sankey', 'geoProjection', 'tile', 'contour',
      ])
      const d3Safe = new Proxy(d3, {
        get(target, prop) {
          if (typeof prop === 'string' && UNAVAILABLE_PLUGINS.has(prop)) {
            throw new Error(
              `d3.${prop}() is not available — only core D3.js v7 is included. ` +
              'Use plain SVG for annotations and HTML for legends.',
            )
          }
          return (target as Record<string | symbol, unknown>)[prop]
        },
      })

      const svg = d3Safe.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', '0 0 ' + width + ' ' + height)
        .style('max-width', '100%')
        .style('height', 'auto')
        .style('overflow', 'hidden')
        .style('touch-action', 'none')
        .style('color', '#000')

      // Build the function body with string concat to avoid
      // breaking any template literals in the generated code.
      const body = [
        '"use strict";',
        'try {',
        code,
        '} catch (e) {',
        '  throw new Error("Chart rendering error: " + e.message);',
        '}',
      ].join('\n')

      const renderChart = new Function(
        'd3', 'svg', 'data', 'width', 'height', 'margin', 'container',
        body,
      )

      // Clone data to prevent generated code from mutating shared state
      const safeData = structuredClone(data)

      renderChart(d3Safe, svg, safeData, width, height, margin, d3Safe.select(container))

      // Prevent brush/zoom drag conflict: stop mousedown on brush overlays
      // from bubbling to the SVG where d3.zoom would capture them.
      // When the brush group is hidden (Pan mode), events don't reach it.
      // When visible (Select mode), this blocks zoom from starting a drag.
      container.querySelectorAll('.brush').forEach((brushEl) => {
        brushEl.addEventListener('mousedown', (e) => e.stopPropagation())
        brushEl.addEventListener('touchstart', (e) => e.stopPropagation())
      })

      // Propagate SVG background color to container so HTML legends match
      const svgEl = container.querySelector('svg')
      if (svgEl) {
        const bg = getComputedStyle(svgEl).backgroundColor
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          container.style.backgroundColor = bg
          // If background is dark, set light text color for legend readability
          const match = bg.match(/\d+/g)
          if (match) {
            const [r, g, b] = match.map(Number)
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
            if (luminance < 0.5) {
              container.style.color = '#e5e5e5'
            }
          }
        }
      }

      if (isMounted) {
        setLoading(false)
        onRenderSuccess?.()
      }
    } catch (err) {
      console.error('D3 rendering error:', err)
      if (isMounted) {
        const errorMsg = (err as Error).message
        setError(errorMsg)
        setLoading(false)
        onRenderError?.(errorMsg)
      }
    }

    return () => {
      isMounted = false
      d3.select(container).selectAll('*').remove()
    }
  }, [code, data])

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg)]/80 z-10">
          <Spinner />
        </div>
      )}

      {error && (
        <div className="space-y-3">
          <div className="p-4 bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-card">
            <p className="text-red-400 text-sm">{error}</p>
            <details className="mt-2">
              <summary className="text-sm text-red-400/70 cursor-pointer">View code</summary>
              <pre className="mt-2 p-2 bg-[var(--surface-2)] rounded-[10px] text-xs overflow-auto max-h-64 text-[var(--text-muted)] font-mono">
                {code}
              </pre>
            </details>
          </div>
          {onRetry && (
            <div className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-card border border-[var(--border)]">
              {creditRefunded && (
                <span className="text-sm text-green-400 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Credit refunded
                </span>
              )}
              <button
                onClick={onRetry}
                className="px-3 py-1.5 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors duration-fast"
              >
                Regenerate Chart
              </button>
            </div>
          )}
        </div>
      )}

      <div
        ref={containerRef}
        className={`min-h-[300px] max-w-full overflow-x-auto ${error ? 'hidden' : ''}`}
        style={{ position: 'relative', color: '#000' }}
      />
    </div>
  )
})
