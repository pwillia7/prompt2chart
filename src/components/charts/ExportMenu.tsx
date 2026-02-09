import { useEffect, useRef, useState } from 'react'
import type { Chart, VegaLiteSpec } from '../../types'
import type { D3ChartHandle } from './D3ChartRenderer'
import type { VegaChartHandle } from './ChartRenderer'
import {
  d3SvgToString,
  d3SvgToPng,
  vegaToPng,
  vegaToSvg,
  downloadPng,
  downloadSvg,
  downloadHtml,
  copyToClipboard,
  buildStandaloneHtmlD3,
  buildStandaloneHtmlVegaLite,
} from '../../lib/chartExporter'

interface ExportMenuProps {
  chart: Chart
  d3Handle: D3ChartHandle | null
  vegaHandle: VegaChartHandle | null
  data: unknown[] | null
}

export function ExportMenu({ chart, d3Handle, vegaHandle, data }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Click-outside handler
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2000)
    return () => clearTimeout(t)
  }, [toast])

  const isD3 = chart.chart_library === 'd3'

  async function handleExport(action: 'png' | 'svg' | 'code' | 'html') {
    setOpen(false)
    try {
      if (isD3) {
        const svgEl = d3Handle?.getSvgEl()
        if (!svgEl) throw new Error('Chart SVG not found')

        switch (action) {
          case 'png': {
            const blob = await d3SvgToPng(svgEl)
            downloadPng(blob, 'chart')
            setToast('PNG downloaded')
            break
          }
          case 'svg': {
            const str = d3SvgToString(svgEl)
            downloadSvg(str, 'chart')
            setToast('SVG downloaded')
            break
          }
          case 'code': {
            await copyToClipboard(chart.d3_code ?? '')
            setToast('Code copied to clipboard')
            break
          }
          case 'html': {
            const html = buildStandaloneHtmlD3(chart.d3_code ?? '', data ?? [])
            downloadHtml(html, 'chart')
            setToast('HTML downloaded')
            break
          }
        }
      } else {
        // Vega-Lite
        const view = vegaHandle?.getView()

        switch (action) {
          case 'png': {
            if (!view) throw new Error('Vega view not available')
            const blob = await vegaToPng(view)
            downloadPng(blob, 'chart')
            setToast('PNG downloaded')
            break
          }
          case 'svg': {
            if (!view) throw new Error('Vega view not available')
            const str = await vegaToSvg(view)
            downloadSvg(str, 'chart')
            setToast('SVG downloaded')
            break
          }
          case 'code': {
            const spec = chart.vega_spec_json as VegaLiteSpec
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { data: _d, ...specWithoutData } = spec
            await copyToClipboard(JSON.stringify(specWithoutData, null, 2))
            setToast('Spec copied to clipboard')
            break
          }
          case 'html': {
            const html = buildStandaloneHtmlVegaLite(chart.vega_spec_json as VegaLiteSpec)
            downloadHtml(html, 'chart')
            setToast('HTML downloaded')
            break
          }
        }
      }
    } catch (err) {
      console.error('Export failed:', err)
      setToast('Export failed: ' + (err as Error).message)
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-200 text-gray-900 hover:bg-gray-300 transition-colors"
      >
        {/* Download icon */}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-50 py-1">
          <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Image</div>
          <button
            onClick={() => handleExport('png')}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            PNG Image
          </button>
          <button
            onClick={() => handleExport('svg')}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            SVG Vector
          </button>

          <div className="border-t border-gray-100 my-1" />

          <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">Code</div>
          <button
            onClick={() => handleExport('code')}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Code
          </button>
          <button
            onClick={() => handleExport('html')}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Download HTML
          </button>
        </div>
      )}

      {/* Feedback toast */}
      {toast && (
        <div className="absolute right-0 mt-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
