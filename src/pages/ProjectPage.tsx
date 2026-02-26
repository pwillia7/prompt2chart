import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { DatasetUploader } from '../components/datasets/DatasetUploader'
import { SchemaDisplay } from '../components/datasets/SchemaDisplay'
import { DataPreview } from '../components/datasets/DataPreview'
import { ChartRenderer, VegaChartHandle } from '../components/charts/ChartRenderer'
import { D3ChartRenderer, D3ChartHandle } from '../components/charts/D3ChartRenderer'
import { ChartPromptInput } from '../components/charts/ChartPromptInput'
import { AnalystNotes } from '../components/charts/AnalystNotes'
import { InsightSuggestions } from '../components/charts/InsightSuggestions'
import { ExportMenu } from '../components/charts/ExportMenu'
import { ShareModal } from '../components/charts/ShareModal'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { useProjectStore } from '../store/projectStore'
import { useDatasetStore } from '../store/datasetStore'
import { useChartStore } from '../store/chartStore'
import { trackUsage } from '../lib/usageTracker'
import { track } from '../lib/analytics'
import { sampleData } from '../lib/dataSampler'
import { d3SvgToPng, vegaToPng } from '../lib/chartExporter'
import { supabase } from '../lib/supabase'
import { useBillingStore } from '../store/billingStore'
import { Chart, ChartLibrary } from '../types'

interface ChartTreeNode {
  chart: Chart
  children: ChartTreeNode[]
}

function buildChartTree(charts: Chart[]): ChartTreeNode[] {
  const nodeMap = new Map<string, ChartTreeNode>()
  for (const chart of charts) {
    nodeMap.set(chart.id, { chart, children: [] })
  }
  const roots: ChartTreeNode[] = []
  for (const chart of charts) {
    const node = nodeMap.get(chart.id)!
    const parentId = chart.parent_chart_id
    if (parentId && nodeMap.has(parentId)) {
      nodeMap.get(parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  // Roots newest-first (matches current behavior), children oldest-first (chronological refinement)
  roots.sort((a, b) => new Date(b.chart.created_at).getTime() - new Date(a.chart.created_at).getTime())
  for (const node of nodeMap.values()) {
    node.children.sort((a, b) => new Date(a.chart.created_at).getTime() - new Date(b.chart.created_at).getTime())
  }
  return roots
}

function ChartTreeItem({
  node,
  depth,
  currentChartId,
  collapsedNodes,
  onSelect,
  onToggleCollapse,
}: {
  node: ChartTreeNode
  depth: number
  currentChartId: string | undefined
  collapsedNodes: Set<string>
  onSelect: (chart: Chart) => void
  onToggleCollapse: (chartId: string) => void
}) {
  const chart = node.chart
  const hasChildren = node.children.length > 0
  const isCollapsed = collapsedNodes.has(chart.id)

  return (
    <>
      <button
        onClick={() => onSelect(chart)}
        className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-fast ${
          currentChartId === chart.id
            ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
            : 'hover:bg-[var(--surface-2)]'
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        <div className="flex items-center gap-1.5">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleCollapse(chart.id)
              }}
              className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-[var(--text-subtle)] hover:text-[var(--text-muted)]"
            >
              <svg
                className={`w-3 h-3 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : depth > 0 ? (
            <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-[var(--text-subtle)] text-xs">&raquo;</span>
          ) : (
            <span className="flex-shrink-0 w-4 h-4" />
          )}
          <span className={`flex-shrink-0 w-2 h-2 rounded-full ${
            chart.chart_library === 'd3' ? 'bg-orange-400' : 'bg-[var(--text-subtle)]'
          }`} />
          <span className="font-medium text-sm truncate" title={chart.prompt}>{chart.prompt}</span>
        </div>
        <div className="text-xs text-[var(--text-subtle)]" style={{ marginLeft: '1.625rem' }}>
          {new Date(chart.created_at).toLocaleString()}
        </div>
      </button>
      {hasChildren && !isCollapsed && node.children.map((child) => (
        <ChartTreeItem
          key={child.chart.id}
          node={child}
          depth={depth + 1}
          currentChartId={currentChartId}
          collapsedNodes={collapsedNodes}
          onSelect={onSelect}
          onToggleCollapse={onToggleCollapse}
        />
      ))}
    </>
  )
}

export function ProjectPage() {
  useDocumentTitle('Project - Prompt2Chart')
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'data' | 'charts'>('data')
  const [selectedLibrary, setSelectedLibrary] = useState<ChartLibrary>('d3')
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const d3Ref = useRef<D3ChartHandle>(null)
  const vegaRef = useRef<VegaChartHandle>(null)

  const { currentProject, fetchProject, loading: projectLoading } = useProjectStore()
  const { datasets, currentDataset, parsedData, fetchDatasets, loadDatasetData, setCurrentDataset } = useDatasetStore()
  const { charts, currentChart, generating, generateChart, fetchCharts, setCurrentChart, error: chartError } = useChartStore()

  const renderData = useMemo(() => parsedData ? sampleData(parsedData) : null, [parsedData])
  const chartTree = useMemo(() => buildChartTree(charts), [charts])
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set())
  const toggleCollapse = (chartId: string) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev)
      if (next.has(chartId)) next.delete(chartId)
      else next.add(chartId)
      return next
    })
  }

  const allSchemas = useMemo(() =>
    datasets.map(ds => ({
      datasetId: ds.id,
      fileName: ds.file_path.split('/').pop() || ds.file_path,
      schema: ds.schema_json,
    })),
    [datasets]
  )

  useEffect(() => {
    if (projectId) {
      setCurrentDataset(null)
      setCurrentChart(null)
      fetchProject(projectId)
      fetchDatasets(projectId)
      fetchCharts(projectId)
    }
  }, [projectId, fetchProject, fetchDatasets, fetchCharts, setCurrentDataset, setCurrentChart])

  useEffect(() => {
    if (datasets.length > 0 && !currentDataset) {
      const dataset = datasets[0]
      setCurrentDataset(dataset)
      loadDatasetData(dataset)
    }
  }, [datasets, currentDataset, setCurrentDataset, loadDatasetData])

  const handleSelectChart = (chart: Chart) => {
    setCurrentChart(chart)
    if (chart.dataset_id && chart.dataset_id !== currentDataset?.id) {
      const ds = datasets.find(d => d.id === chart.dataset_id)
      if (ds) {
        setCurrentDataset(ds)
        loadDatasetData(ds)
      }
    }
  }

  const autoRetryCountRef = useRef(0)
  const lastGeneratedIdRef = useRef<string | null>(null)
  const isAutoRetryRef = useRef(false)
  const refundedChartIdsRef = useRef<Set<string>>(new Set())
  const [creditRefunded, setCreditRefunded] = useState(false)

  const handleGenerateChart = async (prompt: string, libraryOverride?: ChartLibrary, fromScratch?: boolean) => {
    if (!projectId || !currentDataset || !parsedData) return

    setCreditRefunded(false)
    if (!isAutoRetryRef.current) {
      autoRetryCountRef.current = 0
    }
    isAutoRetryRef.current = false

    trackUsage({ eventType: 'chart_generation', metadata: { projectId } })

    let existingCode: string | undefined
    if (currentChart && !fromScratch) {
      if (currentChart.chart_library === 'd3' && currentChart.d3_code) {
        existingCode = currentChart.d3_code
      } else if (currentChart.chart_library === 'vega-lite' && currentChart.vega_spec_json) {
        const { data: _data, ...specWithoutData } = currentChart.vega_spec_json
        existingCode = JSON.stringify(specWithoutData, null, 2)
      }
    }

    const library = libraryOverride ?? (currentChart ? currentChart.chart_library : selectedLibrary)
    const isEdit = !!currentChart && !fromScratch
    track('chart-generated', { library, isNew: isEdit ? 0 : 1 })
    if (isEdit) {
      track('chart-edited', { library })
    }

    const chart = await generateChart({
      projectId,
      datasetId: currentDataset.id,
      prompt,
      schema: currentDataset.schema_json,
      library,
      existingCode,
      allSchemas,
      parentChartId: currentChart?.id ?? null,
    })
    if (chart) {
      lastGeneratedIdRef.current = chart.id
    }
  }

  const handleStartNewChart = () => {
    setCurrentChart(null)
  }

  const generateShareImage = async (): Promise<Blob | null> => {
    try {
      if (currentChart?.chart_library === 'd3') {
        const svgEl = d3Ref.current?.getSvgEl()
        const containerEl = d3Ref.current?.getContainerEl() ?? undefined
        if (svgEl) return await d3SvgToPng(svgEl, containerEl)
      } else {
        const view = vegaRef.current?.getView()
        if (view) return await vegaToPng(view)
      }
    } catch {
      // best-effort
    }
    return null
  }

  const handleSuggestionSelect = (prompt: string, library?: ChartLibrary) => {
    if (library) setSelectedLibrary(library)
    track('suggestion-clicked', { library: library ?? selectedLibrary })
    handleGenerateChart(prompt, library)
  }

  const handleRenderSuccess = useCallback(() => {
    const chart = useChartStore.getState().currentChart
    if (chart) {
      track('chart-render-success', { library: chart.chart_library })
    }
  }, [])

  const handleRenderError = useCallback(async (errorMsg: string) => {
    // Read fresh state from the store to avoid stale closures
    const chart = useChartStore.getState().currentChart
    if (!chart) return
    track('chart-render-error', { library: chart.chart_library })
    if (chart.id !== lastGeneratedIdRef.current) return

    // Always refund credit for render failures (once per chart)
    if (!refundedChartIdsRef.current.has(chart.id)) {
      refundedChartIdsRef.current.add(chart.id)
      try {
        const { data, error } = await supabase.functions.invoke('refund-credit', {
          body: { chartId: chart.id },
        })
        if (error) {
          console.error('Credit refund error:', error)
        } else if (data?.balance !== undefined) {
          useBillingStore.getState().setCredits(data.balance)
          setCreditRefunded(true)
        }
      } catch (e) {
        console.error('Credit refund failed:', e)
      }
    }

    // Auto-retry up to 2 times (skip if already generating)
    if (useChartStore.getState().generating) return
    if (autoRetryCountRef.current >= 2) return
    autoRetryCountRef.current++
    isAutoRetryRef.current = true
    handleGenerateChart(
      chart.prompt + `\n\nIMPORTANT: The previous code failed with this rendering error: "${errorMsg}". Generate completely new code that avoids this error.`,
      undefined,
      true, // fromScratch — don't pass broken code as existingCode
    )
  }, [])

  if (projectLoading && !currentProject) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (!currentProject) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-[var(--text)]">Project not found</h2>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-[var(--text-muted)] hover:text-[var(--text)] mb-4 transition-colors duration-fast"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-[var(--text)]">{currentProject.name}</h1>
      </div>

      <div className="flex border-b border-[var(--border)] mb-6">
        <button
          onClick={() => setActiveTab('data')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors duration-fast ${
            activeTab === 'data'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--text-subtle)] hover:text-[var(--text-muted)]'
          }`}
        >
          Data
        </button>
        <button
          onClick={() => setActiveTab('charts')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors duration-fast ${
            activeTab === 'charts'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--text-subtle)] hover:text-[var(--text-muted)]'
          }`}
        >
          Charts ({charts.length})
        </button>
      </div>

      {activeTab === 'data' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-[var(--surface-1)] rounded-card border border-[var(--border)] p-6">
              <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Upload Dataset</h2>
              <DatasetUploader
                projectId={projectId!}
                onUploadComplete={(fileType) => {
                  trackUsage({ eventType: 'dataset_upload', metadata: { projectId } })
                  track('dataset-uploaded', { fileType })
                }}
              />
            </div>

            {datasets.length > 0 && (
              <div className="bg-[var(--surface-1)] rounded-card border border-[var(--border)] p-6">
                <h3 className="text-sm font-medium text-[var(--text)] mb-3">Your Datasets</h3>
                <div className="space-y-2">
                  {datasets.map((dataset) => (
                    <button
                      key={dataset.id}
                      onClick={() => {
                        setCurrentDataset(dataset)
                        loadDatasetData(dataset)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-fast ${
                        currentDataset?.id === dataset.id
                          ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                          : 'hover:bg-[var(--surface-2)]'
                      }`}
                    >
                      <div className="font-medium text-sm">
                        {dataset.file_path.split('/').pop()}
                      </div>
                      <div className="text-xs text-[var(--text-subtle)]">
                        {dataset.row_count.toLocaleString()} rows
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {currentDataset && (
              <>
                <SchemaDisplay schema={currentDataset.schema_json} />
                {parsedData && (
                  <DataPreview data={parsedData} schema={currentDataset.schema_json} />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Current chart display */}
            {currentChart && (
              <>
                <div className="bg-[var(--surface-1)] rounded-card border border-[var(--border)] p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2 flex-1 mr-4 min-w-0">
                      <h3 className="font-medium text-[var(--text)] truncate">
                        {currentChart.prompt}
                      </h3>
                      <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-pill ${
                        currentChart.chart_library === 'd3'
                          ? 'bg-orange-500/15 text-orange-400'
                          : 'bg-[var(--surface-3)] text-[var(--text-muted)]'
                      }`}>
                        {currentChart.chart_library === 'd3' ? 'D3.js' : 'Vega-Lite'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShareModalOpen(true)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-[10px] bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border-strong)] hover:bg-[var(--surface-3)] transition-colors duration-fast"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share
                      </button>
                      <ExportMenu
                        chart={currentChart}
                        d3Handle={d3Ref.current}
                        vegaHandle={vegaRef.current}
                        data={parsedData}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleStartNewChart}
                      >
                        New Chart
                      </Button>
                    </div>
                  </div>
                  <div className="relative">
                    {currentChart.chart_library === 'd3' && currentChart.d3_code && renderData ? (
                      <D3ChartRenderer ref={d3Ref} code={currentChart.d3_code} data={renderData} onRetry={() => handleGenerateChart(currentChart.prompt, undefined, true)} onRenderError={handleRenderError} onRenderSuccess={handleRenderSuccess} creditRefunded={creditRefunded} />
                    ) : currentChart.vega_spec_json ? (
                      <ChartRenderer ref={vegaRef} spec={currentChart.vega_spec_json} data={renderData ?? undefined} onRetry={() => handleGenerateChart(currentChart.prompt, undefined, true)} onRenderError={handleRenderError} onRenderSuccess={handleRenderSuccess} creditRefunded={creditRefunded} />
                    ) : (
                      <div className="p-8 text-center text-[var(--text-subtle)]">
                        Unable to render chart: missing data
                      </div>
                    )}
                    {generating && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg)]/70 backdrop-blur-[1px] z-20 rounded-card">
                        <div className="flex flex-col items-center gap-2">
                          <Spinner />
                          <span className="text-sm text-[var(--text-muted)] font-medium">Updating chart...</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {parsedData && renderData && parsedData.length > renderData.length && (
                    <p className="mt-2 text-xs text-[var(--text-subtle)] text-center">
                      Showing {renderData.length.toLocaleString()} of {parsedData.length.toLocaleString()} rows (sampled for performance)
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Empty state / generating first chart */}
            {!currentChart && currentDataset && (
              <div className="bg-[var(--surface-1)] rounded-card border border-[var(--border)] p-12 text-center relative">
                {generating ? (
                  <div className="flex flex-col items-center gap-3">
                    <Spinner />
                    <p className="text-sm text-[var(--text-muted)] font-medium">Generating chart...</p>
                  </div>
                ) : (
                  <>
                    <svg className="mx-auto h-12 w-12 text-[var(--text-subtle)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-[var(--text)]">No chart selected</h3>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      Enter a prompt below to generate a visualization
                    </p>
                  </>
                )}
              </div>
            )}

            {/* No dataset warning */}
            {!currentDataset && (
              <div className="bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded-card p-6 text-center">
                <p className="text-amber-400">
                  Please upload a dataset first before generating charts
                </p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => setActiveTab('data')}
                >
                  Go to Data Tab
                </Button>
              </div>
            )}

            {/* Generation error */}
            {chartError && (
              <div className="p-4 bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-card text-red-400 text-sm">
                {chartError}
              </div>
            )}

            {/* Chart generation controls */}
            {currentDataset && (
              <div className="bg-[var(--surface-1)] rounded-card border border-[var(--border)] p-6 space-y-4">
                {currentChart ? (
                  <>
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-[var(--text)]">
                        Refine Chart
                      </h3>
                      <button
                        onClick={handleStartNewChart}
                        className="text-sm text-[var(--text-subtle)] hover:text-[var(--text-muted)] transition-colors duration-fast"
                      >
                        + New chart instead
                      </button>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-2)] rounded-lg text-sm text-[var(--text-muted)]">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="truncate">{currentChart.prompt}</span>
                      <span className={`flex-shrink-0 px-1.5 py-0.5 text-xs font-medium rounded-pill ${
                        currentChart.chart_library === 'd3'
                          ? 'bg-orange-500/15 text-orange-400'
                          : 'bg-[var(--surface-3)] text-[var(--text-muted)]'
                      }`}>
                        {currentChart.chart_library === 'd3' ? 'D3' : 'Vega-Lite'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-[var(--text)]">
                      Create Chart
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                        Visualization Library
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedLibrary('vega-lite')}
                          className={`flex-1 px-4 py-2.5 rounded-card border-2 text-sm font-medium transition-colors duration-fast ${
                            selectedLibrary === 'vega-lite'
                              ? 'border-[var(--text-subtle)] bg-[var(--surface-2)] text-[var(--text-muted)]'
                              : 'border-[var(--border-strong)] text-[var(--text-muted)] hover:border-[var(--text-subtle)]'
                          }`}
                        >
                          <div className="font-semibold">Vega-Lite</div>
                          <div className="text-xs mt-0.5 opacity-75">Declarative charts</div>
                        </button>
                        <button
                          onClick={() => setSelectedLibrary('d3')}
                          className={`flex-1 px-4 py-2.5 rounded-card border-2 text-sm font-medium transition-colors duration-fast ${
                            selectedLibrary === 'd3'
                              ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                              : 'border-[var(--border-strong)] text-[var(--text-muted)] hover:border-[var(--text-subtle)]'
                          }`}
                        >
                          <div className="font-semibold">D3.js</div>
                          <div className="text-xs mt-0.5 opacity-75">Custom & interactive</div>
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-[var(--text-subtle)] flex gap-3">
                      <span>Examples:</span>
                      <a href="https://vega.github.io/vega-lite/examples/" target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-[var(--text)] underline">Vega-Lite Gallery</a>
                      <a href="https://observablehq.com/@d3/gallery" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 underline">D3.js Gallery</a>
                    </div>
                    <InsightSuggestions
                      datasetId={currentDataset.id}
                      schema={currentDataset.schema_json}
                      allSchemas={allSchemas}
                      onSelectSuggestion={handleSuggestionSelect}
                      disabled={generating}
                    />
                  </>
                )}

                <ChartPromptInput
                  onSubmit={handleGenerateChart}
                  loading={generating}
                  placeholder={
                    currentChart
                      ? 'e.g. "Add tooltips", "Change colors to blue", "Add zoom"...'
                      : selectedLibrary === 'd3'
                        ? 'e.g. "Create a donut chart of sales by category with hover tooltips"'
                        : 'e.g. "Show a bar chart of revenue by month"'
                  }
                  submitLabel={currentChart ? 'Update Chart' : 'Generate Chart'}
                  disabled={!currentDataset}
                />
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {currentChart?.explanation && (
              <AnalystNotes
                explanation={currentChart.explanation}
                chart={currentChart}
                schema={currentDataset?.schema_json}
                allSchemas={allSchemas}
                onSuggestionClick={handleGenerateChart}
              />
            )}
            <div className="bg-[var(--surface-1)] rounded-card border border-[var(--border)] p-4">
              <h3 className="text-sm font-medium text-[var(--text)] mb-3">Chart History</h3>
              {charts.length === 0 ? (
                <p className="text-sm text-[var(--text-subtle)]">No charts yet</p>
              ) : (
                <div className="space-y-1">
                  {chartTree.map((node) => (
                    <ChartTreeItem
                      key={node.chart.id}
                      node={node}
                      depth={0}
                      currentChartId={currentChart?.id}
                      collapsedNodes={collapsedNodes}
                      onSelect={handleSelectChart}
                      onToggleCollapse={toggleCollapse}
                    />
                  ))}
                </div>
              )}
            </div>
            <Link
              to="/feedback"
              className="flex items-center gap-1.5 text-xs text-[var(--text-subtle)] hover:text-[var(--text-muted)] transition-colors duration-fast"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Send Feedback
            </Link>
          </div>
        </div>
      )}

      {shareModalOpen && currentChart && (
        <ShareModal
          chart={currentChart}
          data={renderData}
          onClose={() => setShareModalOpen(false)}
          generateImage={generateShareImage}
        />
      )}
    </Layout>
  )
}
