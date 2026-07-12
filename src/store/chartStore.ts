import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { Chart, ChartLibrary, VegaLiteSpec, ConversationMessage, ChartEditHistory, DatasetSchema, ChartGenerationResponse } from '../types'
import { useBillingStore } from './billingStore'

export interface AllSchemaEntry {
  datasetId: string
  fileName: string
  schema: DatasetSchema
}

interface GenerateChartOptions {
  projectId: string
  datasetId: string
  prompt: string
  schema: DatasetSchema
  library: ChartLibrary
  existingCode?: string
  allSchemas?: AllSchemaEntry[]
  parentChartId?: string | null
}

export interface AnalystChatMsg {
  role: 'user' | 'analyst'
  content: string
}

interface ChartState {
  charts: Chart[]
  currentChart: Chart | null
  editHistories: Map<string, ChartEditHistory>
  analystChats: Map<string, AnalystChatMsg[]>
  loading: boolean
  generating: boolean
  error: string | null
  fetchCharts: (projectId: string) => Promise<void>
  generateChart: (options: GenerateChartOptions) => Promise<Chart | null>
  updateChart: (id: string, updates: Partial<Chart>) => Promise<void>
  deleteChart: (id: string) => Promise<void>
  setCurrentChart: (chart: Chart | null) => void
  addToEditHistory: (chartId: string, message: ConversationMessage) => void
  getEditHistory: (chartId: string) => ConversationMessage[]
  getAnalystChat: (chartId: string) => AnalystChatMsg[]
  setAnalystChat: (chartId: string, messages: AnalystChatMsg[]) => void
}

export const useChartStore = create<ChartState>((set, get) => ({
  charts: [],
  currentChart: null,
  editHistories: new Map(),
  analystChats: new Map(),
  loading: false,
  generating: false,
  error: null,

  fetchCharts: async (projectId: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('charts')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ charts: (data || []).map(normalizeChart) })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  generateChart: async ({ projectId, datasetId, prompt, schema, library, existingCode, allSchemas, parentChartId }: GenerateChartOptions) => {
    set({ generating: true, error: null })
    try {
      const { data: responseData, error: fnError } = await supabase.functions.invoke('generate-chart', {
        body: {
          prompt,
          schema,
          library,
          existingCode: existingCode || null,
          allSchemas: allSchemas || undefined,
        },
      })

      if (fnError) {
        // Try to extract a meaningful error message from the edge function response
        try {
          const body = await (fnError as any).context?.json?.()
          if (body?.creditsRemaining !== undefined) {
            useBillingStore.getState().setCredits(body.creditsRemaining)
          }
          if (body?.error) throw new Error(body.error)
        } catch (e) {
          if (e instanceof Error && e.message !== (fnError as Error).message) throw e
        }
        throw fnError
      }

      const response = responseData as ChartGenerationResponse & { creditsRemaining?: number }

      // Update credit balance from response
      if (response.creditsRemaining !== undefined) {
        useBillingStore.getState().setCredits(response.creditsRemaining)
      }
      const isD3 = response.library === 'd3' || library === 'd3'

      // Build insert payload based on library
      const insertPayload: Record<string, unknown> = {
        project_id: projectId,
        dataset_id: datasetId,
        prompt,
        chart_library: isD3 ? 'd3' : 'vega-lite',
        explanation: response.reasoning,
      }

      if (parentChartId) {
        insertPayload.parent_chart_id = parentChartId
      }

      if (isD3) {
        insertPayload.d3_code = response.d3Code || ''
        insertPayload.vega_spec_json = null
      } else {
        insertPayload.vega_spec_json = response.vegaLiteSpec ?? null
        insertPayload.d3_code = null
      }

      const { data: chartData, error } = await supabase
        .from('charts')
        .insert(insertPayload)
        .select()
        .single()

      if (error) throw error

      const chart = normalizeChart(chartData)

      get().addToEditHistory(chart.id, {
        role: 'user',
        content: prompt,
        timestamp: new Date(),
      })
      get().addToEditHistory(chart.id, {
        role: 'assistant',
        content: response.reasoning,
        spec: chart.vega_spec_json || undefined,
        timestamp: new Date(),
      })

      set({
        charts: [chart, ...get().charts],
        currentChart: chart,
      })
      return chart
    } catch (error) {
      set({ error: (error as Error).message })
      return null
    } finally {
      set({ generating: false })
    }
  },

  updateChart: async (id: string, updates: Partial<Chart>) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('charts')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      set({
        charts: get().charts.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
        currentChart: get().currentChart?.id === id
          ? { ...get().currentChart!, ...updates }
          : get().currentChart,
      })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  deleteChart: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('charts')
        .delete()
        .eq('id', id)

      if (error) throw error

      const editHistories = new Map(get().editHistories)
      editHistories.delete(id)

      set({
        charts: get().charts.filter((c) => c.id !== id),
        currentChart: get().currentChart?.id === id ? null : get().currentChart,
        editHistories,
      })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  setCurrentChart: (chart: Chart | null) => {
    set({ currentChart: chart })
  },

  addToEditHistory: (chartId: string, message: ConversationMessage) => {
    const editHistories = new Map(get().editHistories)
    const history = editHistories.get(chartId) || { chartId, messages: [] }
    history.messages.push(message)
    editHistories.set(chartId, history)
    set({ editHistories })
  },

  getEditHistory: (chartId: string) => {
    return get().editHistories.get(chartId)?.messages || []
  },

  getAnalystChat: (chartId: string) => {
    return get().analystChats.get(chartId) || []
  },

  setAnalystChat: (chartId: string, messages: AnalystChatMsg[]) => {
    const analystChats = new Map(get().analystChats)
    analystChats.set(chartId, messages)
    set({ analystChats })
  },
}))

// Normalize chart data from DB (handles missing columns for older rows)
export function normalizeChart(row: Record<string, unknown>): Chart {
  return {
    id: row.id as string,
    project_id: row.project_id as string,
    dataset_id: (row.dataset_id as string) || null,
    prompt: row.prompt as string,
    chart_library: (row.chart_library as ChartLibrary) || 'vega-lite',
    vega_spec_json: (row.vega_spec_json as VegaLiteSpec) || null,
    d3_code: (row.d3_code as string) || null,
    explanation: (row.explanation as string) || null,
    parent_chart_id: (row.parent_chart_id as string) || null,
    created_at: row.created_at as string,
  }
}
