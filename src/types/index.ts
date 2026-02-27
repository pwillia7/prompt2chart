export interface User {
  id: string
  email: string
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface ColumnSchema {
  name: string
  type: 'numeric' | 'categorical' | 'temporal' | 'string'
  nullable: boolean
  sample_values: (string | number | null)[]
}

export interface DatasetSchema {
  columns: ColumnSchema[]
  rowCount: number
}

export interface Dataset {
  id: string
  project_id: string
  file_path: string
  schema_json: DatasetSchema
  row_count: number
  created_at: string
}

export type ChartLibrary = 'vega-lite' | 'd3'

export interface Chart {
  id: string
  project_id: string
  dataset_id: string | null
  prompt: string
  chart_library: ChartLibrary
  vega_spec_json: VegaLiteSpec | null
  d3_code: string | null
  explanation: string | null
  parent_chart_id: string | null
  created_at: string
}

export interface UsageEvent {
  id: string
  user_id: string
  event_type: 'chart_generation' | 'dataset_upload' | 'llm_call'
  metadata: Record<string, unknown>
  created_at: string
}

export interface VegaLiteSpec {
  $schema?: string
  title?: string
  description?: string
  data?: { values?: unknown[] } | { url?: string }
  mark?: string | { type: string; [key: string]: unknown }
  encoding?: Record<string, unknown>
  layer?: VegaLiteSpec[]
  [key: string]: unknown
}

export interface ChartGenerationRequest {
  prompt: string
  schema: DatasetSchema
  existingSpec?: VegaLiteSpec | null
  data?: unknown[]
}

export interface ChartGenerationResponse {
  chartType: string
  library: ChartLibrary
  vegaLiteSpec?: VegaLiteSpec
  d3Code?: string
  reasoning: string
  suggestedFollowups: string[]
}

export interface InsightSuggestion {
  prompt: string
  description: string
  chartType: string
  library?: ChartLibrary
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  spec?: VegaLiteSpec
  timestamp: Date
}

export interface ChartEditHistory {
  chartId: string
  messages: ConversationMessage[]
}

export interface SharedChart {
  id: string
  chart_id: string | null
  created_by: string
  prompt: string
  chart_library: ChartLibrary
  d3_code: string | null
  vega_spec_json: VegaLiteSpec | null
  explanation: string | null
  data_snapshot: unknown[] | null
  og_image_url: string | null
  project_name: string | null
  prompt_history: { prompt: string; chart_library: string }[] | null
  created_at: string
}
