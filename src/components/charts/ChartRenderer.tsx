import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import embed, { VisualizationSpec } from 'vega-embed'
import type { View } from 'vega'
import { VegaLiteSpec } from '../../types'
import { addDefaultsToSpec, compileToVega } from '../../lib/vegaHelpers'
import { Spinner } from '../ui/Spinner'

export interface VegaChartHandle {
  getView(): View | null
  getContainerEl(): HTMLDivElement | null
}

interface ChartRendererProps {
  spec: VegaLiteSpec
  data?: unknown[]
  className?: string
  onRetry?: () => void
  onRenderError?: (error: string) => void
  creditRefunded?: boolean
}

export const ChartRenderer = forwardRef<VegaChartHandle, ChartRendererProps>(function ChartRenderer({ spec, data, className = '', onRetry, onRenderError, creditRefunded }, ref) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<View | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [usedFallback, setUsedFallback] = useState(false)

  useImperativeHandle(ref, () => ({
    getView: () => viewRef.current,
    getContainerEl: () => containerRef.current,
  }))

  useEffect(() => {
    if (!containerRef.current || !spec) return

    let isMounted = true
    setLoading(true)
    setError(null)
    setUsedFallback(false)

    async function renderChart() {
      if (!containerRef.current || !isMounted) return

      try {
        // Merge data into spec if spec doesn't already have it (backward compat)
        let renderSpec = spec
        if (data && (!spec.data || !('values' in spec.data) || !spec.data.values?.length)) {
          renderSpec = { ...spec, data: { values: data } }
        }

        // Add defaults to spec
        const enhancedSpec = addDefaultsToSpec(renderSpec)

        // Try Vega-Lite first
        const result = await embed(containerRef.current, enhancedSpec as VisualizationSpec, {
          actions: false,
          renderer: 'canvas',
        })
        viewRef.current = result.view

        if (isMounted) {
          setLoading(false)
        }
      } catch (vlError) {
        console.warn('Vega-Lite rendering failed, trying Vega fallback:', vlError)

        // Try Vega fallback
        try {
          const vegaSpec = compileToVega(spec)
          if (!vegaSpec) throw vlError

          const fallbackResult = await embed(containerRef.current!, vegaSpec as VisualizationSpec, {
            actions: false,
            renderer: 'canvas',
            mode: 'vega',
          })
          viewRef.current = fallbackResult.view

          if (isMounted) {
            setUsedFallback(true)
            setLoading(false)
          }
        } catch (vgError) {
          if (isMounted) {
            const errorMsg = `Failed to render chart: ${(vlError as Error).message}`
            setError(errorMsg)
            setLoading(false)
            onRenderError?.(errorMsg)
          }
        }
      }
    }

    renderChart()

    return () => {
      isMounted = false
    }
  }, [spec, data])

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
              <summary className="text-sm text-red-400/70 cursor-pointer">View spec</summary>
              <pre className="mt-2 p-2 bg-[var(--surface-2)] rounded-[10px] text-xs overflow-auto max-h-64 text-[var(--text-muted)] font-mono">
                {JSON.stringify(spec, null, 2)}
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
        className={`min-h-[420px] max-w-full overflow-x-auto ${error ? 'hidden' : ''}`}
        style={{ maxHeight: '500px', color: '#000' }}
      />

      {usedFallback && !error && (
        <p className="mt-2 text-xs text-amber-400">
          Rendered using Vega fallback
        </p>
      )}
    </div>
  )
})
