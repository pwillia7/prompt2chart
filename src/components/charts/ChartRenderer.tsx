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
  className?: string
}

export const ChartRenderer = forwardRef<VegaChartHandle, ChartRendererProps>(function ChartRenderer({ spec, className = '' }, ref) {
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
        // Add defaults to spec
        const enhancedSpec = addDefaultsToSpec(spec)

        // Try Vega-Lite first
        const result = await embed(containerRef.current, enhancedSpec as VisualizationSpec, {
          actions: {
            export: { svg: true, png: true },
            source: false,
            compiled: false,
            editor: false,
          },
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
            actions: {
              export: { svg: true, png: true },
              source: false,
              compiled: false,
              editor: false,
            },
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
            setError(`Failed to render chart: ${(vlError as Error).message}`)
            setLoading(false)
          }
        }
      }
    }

    renderChart()

    return () => {
      isMounted = false
    }
  }, [spec])

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
            <summary className="text-sm text-red-600 cursor-pointer">View spec</summary>
            <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto max-h-64">
              {JSON.stringify(spec, null, 2)}
            </pre>
          </details>
        </div>
      )}

      <div
        ref={containerRef}
        className={`min-h-[420px] max-w-full overflow-x-auto ${error ? 'hidden' : ''}`}
        style={{ maxHeight: '500px' }}
      />

      {usedFallback && !error && (
        <p className="mt-2 text-xs text-amber-600">
          Rendered using Vega fallback
        </p>
      )}
    </div>
  )
})
