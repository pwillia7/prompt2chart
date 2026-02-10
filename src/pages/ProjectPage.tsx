import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { DatasetUploader } from '../components/datasets/DatasetUploader'
import { SchemaDisplay } from '../components/datasets/SchemaDisplay'
import { DataPreview } from '../components/datasets/DataPreview'
import { ChartRenderer, VegaChartHandle } from '../components/charts/ChartRenderer'
import { D3ChartRenderer, D3ChartHandle } from '../components/charts/D3ChartRenderer'
import { ChartPromptInput } from '../components/charts/ChartPromptInput'
import { AnalystNotes } from '../components/charts/AnalystNotes'
import { InsightSuggestions } from '../components/charts/InsightSuggestions'
import { ExportMenu } from '../components/charts/ExportMenu'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { useProjectStore } from '../store/projectStore'
import { useDatasetStore } from '../store/datasetStore'
import { useChartStore } from '../store/chartStore'
import { trackUsage } from '../lib/usageTracker'
import { sampleData } from '../lib/dataSampler'
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
        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
          currentChartId === chart.id
            ? 'bg-primary-50 text-primary-700'
            : 'hover:bg-gray-50'
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
              className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600"
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
            <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-300 text-xs">&raquo;</span>
          ) : (
            <span className="flex-shrink-0 w-4 h-4" />
          )}
          <span className={`flex-shrink-0 w-2 h-2 rounded-full ${
            chart.chart_library === 'd3' ? 'bg-orange-400' : 'bg-blue-400'
          }`} />
          <span className="font-medium text-sm truncate">{chart.prompt}</span>
        </div>
        <div className="text-xs text-gray-500" style={{ marginLeft: '1.625rem' }}>
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
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'data' | 'charts'>('data')
  const [selectedLibrary, setSelectedLibrary] = useState<ChartLibrary>('d3')
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

  const handleGenerateChart = async (prompt: string, libraryOverride?: ChartLibrary) => {
    if (!projectId || !currentDataset || !parsedData) return

    trackUsage({ eventType: 'chart_generation', metadata: { projectId } })

    let existingCode: string | undefined
    if (currentChart) {
      if (currentChart.chart_library === 'd3' && currentChart.d3_code) {
        existingCode = currentChart.d3_code
      } else if (currentChart.chart_library === 'vega-lite' && currentChart.vega_spec_json) {
        const { data: _data, ...specWithoutData } = currentChart.vega_spec_json
        existingCode = JSON.stringify(specWithoutData, null, 2)
      }
    }

    const library = libraryOverride ?? (currentChart ? currentChart.chart_library : selectedLibrary)

    await generateChart({
      projectId,
      datasetId: currentDataset.id,
      prompt,
      schema: currentDataset.schema_json,
      library,
      existingCode,
      allSchemas,
      parentChartId: currentChart?.id ?? null,
    })
  }

  const handleStartNewChart = () => {
    setCurrentChart(null)
  }

  const handleSuggestionSelect = (prompt: string, library?: ChartLibrary) => {
    if (library) setSelectedLibrary(library)
    handleGenerateChart(prompt, library)
  }

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
          <h2 className="text-xl font-semibold text-gray-900">Project not found</h2>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/')}>
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
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{currentProject.name}</h1>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('data')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'data'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Data
        </button>
        <button
          onClick={() => setActiveTab('charts')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'charts'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Charts ({charts.length})
        </button>
      </div>

      {activeTab === 'data' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Dataset</h2>
              <DatasetUploader
                projectId={projectId!}
                onUploadComplete={() => {
                  trackUsage({ eventType: 'dataset_upload', metadata: { projectId } })
                }}
              />
            </div>

            {datasets.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Your Datasets</h3>
                <div className="space-y-2">
                  {datasets.map((dataset) => (
                    <button
                      key={dataset.id}
                      onClick={() => {
                        setCurrentDataset(dataset)
                        loadDatasetData(dataset)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        currentDataset?.id === dataset.id
                          ? 'bg-primary-50 text-primary-700'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-sm">
                        {dataset.file_path.split('/').pop()}
                      </div>
                      <div className="text-xs text-gray-500">
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
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2 flex-1 mr-4 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {currentChart.prompt}
                      </h3>
                      <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${
                        currentChart.chart_library === 'd3'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {currentChart.chart_library === 'd3' ? 'D3.js' : 'Vega-Lite'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
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
                  {currentChart.chart_library === 'd3' && currentChart.d3_code && renderData ? (
                    <D3ChartRenderer ref={d3Ref} code={currentChart.d3_code} data={renderData} />
                  ) : currentChart.vega_spec_json ? (
                    <ChartRenderer ref={vegaRef} spec={currentChart.vega_spec_json} data={renderData ?? undefined} />
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      Unable to render chart: missing data
                    </div>
                  )}
                  {parsedData && renderData && parsedData.length > renderData.length && (
                    <p className="mt-2 text-xs text-gray-500 text-center">
                      Showing {renderData.length.toLocaleString()} of {parsedData.length.toLocaleString()} rows (sampled for performance)
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Empty state */}
            {!currentChart && currentDataset && (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No chart selected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Enter a prompt below to generate a visualization
                </p>
              </div>
            )}

            {/* No dataset warning */}
            {!currentDataset && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                <p className="text-amber-700">
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
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {chartError}
              </div>
            )}

            {/* Chart generation controls */}
            {currentDataset && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                {currentChart ? (
                  <>
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Refine Chart
                      </h3>
                      <button
                        onClick={handleStartNewChart}
                        className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        + New chart instead
                      </button>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="truncate">{currentChart.prompt}</span>
                      <span className={`flex-shrink-0 px-1.5 py-0.5 text-xs font-medium rounded ${
                        currentChart.chart_library === 'd3'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {currentChart.chart_library === 'd3' ? 'D3' : 'Vega-Lite'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Create Chart
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Visualization Library
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedLibrary('vega-lite')}
                          className={`flex-1 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                            selectedLibrary === 'vega-lite'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-semibold">Vega-Lite</div>
                          <div className="text-xs mt-0.5 opacity-75">Declarative charts</div>
                        </button>
                        <button
                          onClick={() => setSelectedLibrary('d3')}
                          className={`flex-1 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                            selectedLibrary === 'd3'
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-semibold">D3.js</div>
                          <div className="text-xs mt-0.5 opacity-75">Custom & interactive</div>
                        </button>
                      </div>
                    </div>
                    <InsightSuggestions
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
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Chart History</h3>
              {charts.length === 0 ? (
                <p className="text-sm text-gray-500">No charts yet</p>
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
          </div>
        </div>
      )}
    </Layout>
  )
}
