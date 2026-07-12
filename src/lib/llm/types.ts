// Shared contract types for the LLM lib. Reuses the app's canonical types from
// @/types and adds the few the edge adapter defined locally.
import type { ChartLibrary, DatasetSchema, VegaLiteSpec, InsightSuggestion } from '@/types'

export type { ChartLibrary, DatasetSchema, VegaLiteSpec, InsightSuggestion }

export interface AllSchemaEntry {
  datasetId: string
  fileName: string
  schema: DatasetSchema
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChartResponse {
  chartType: string
  library: ChartLibrary
  vegaLiteSpec?: VegaLiteSpec
  d3Code?: string
  reasoning: string
  suggestedFollowups: string[]
}
