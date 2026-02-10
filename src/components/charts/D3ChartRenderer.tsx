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
}

export const D3ChartRenderer = forwardRef<D3ChartHandle, D3ChartRendererProps>(function D3ChartRenderer({ code, data, className = '' }, ref) {
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

    // Clear previous content
    const container = containerRef.current
    d3.select(container).selectAll('*').remove()

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

      const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', '0 0 ' + width + ' ' + height)
        .style('max-width', '100%')
        .style('height', 'auto')
        .style('overflow', 'hidden')
        .style('touch-action', 'none')

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

      renderChart(d3, svg, safeData, width, height, margin, d3.select(container))

      // Prevent brush/zoom drag conflict: stop mousedown on brush overlays
      // from bubbling to the SVG where d3.zoom would capture them.
      // When the brush group is hidden (Pan mode), events don't reach it.
      // When visible (Select mode), this blocks zoom from starting a drag.
      container.querySelectorAll('.brush').forEach((brushEl) => {
        brushEl.addEventListener('mousedown', (e) => e.stopPropagation())
        brushEl.addEventListener('touchstart', (e) => e.stopPropagation())
      })

      if (isMounted) setLoading(false)
    } catch (err) {
      console.error('D3 rendering error:', err)
      if (isMounted) {
        setError((err as Error).message)
        setLoading(false)
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
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <Spinner />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
          <details className="mt-2">
            <summary className="text-sm text-red-600 cursor-pointer">View code</summary>
            <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto max-h-64">
              {code}
            </pre>
          </details>
        </div>
      )}

      <div
        ref={containerRef}
        className={`min-h-[300px] max-w-full overflow-x-auto ${error ? 'hidden' : ''}`}
        style={{ position: 'relative' }}
      />
    </div>
  )
})
