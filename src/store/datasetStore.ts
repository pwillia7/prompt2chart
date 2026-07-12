import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { bustProjectDatasets } from '../lib/cacheActions'
import { Dataset, DatasetSchema, InsightSuggestion } from '../types'
import { generateSchema, parseData } from '../lib/schemaGenerator'

interface DatasetState {
  datasets: Dataset[]
  currentDataset: Dataset | null
  parsedData: unknown[] | null
  suggestionCache: Map<string, InsightSuggestion[]>
  loading: boolean
  error: string | null
  fetchDatasets: (projectId: string) => Promise<void>
  uploadDataset: (projectId: string, file: File) => Promise<Dataset | null>
  deleteDataset: (id: string) => Promise<void>
  setCurrentDataset: (dataset: Dataset | null) => void
  loadDatasetData: (dataset: Dataset) => Promise<unknown[] | null>
  getCachedSuggestions: (datasetId: string) => InsightSuggestion[] | undefined
  getCachedSuggestionsBySchema: (schemaKey: string) => InsightSuggestion[] | undefined
  cacheSuggestions: (datasetId: string, schemaKey: string, suggestions: InsightSuggestion[]) => void
}

export const useDatasetStore = create<DatasetState>((set, get) => ({
  datasets: [],
  currentDataset: null,
  parsedData: null,
  suggestionCache: new Map(),
  loading: false,
  error: null,

  getCachedSuggestions: (datasetId: string) => {
    // Check in-memory cache first
    const memCached = get().suggestionCache.get(datasetId)
    if (memCached) return memCached

    // Check localStorage by dataset ID (set during cacheSuggestions)
    try {
      const stored = localStorage.getItem(`suggestions:${datasetId}`)
      if (stored) {
        const parsed = JSON.parse(stored) as InsightSuggestion[]
        // Populate in-memory cache
        const cache = new Map(get().suggestionCache)
        cache.set(datasetId, parsed)
        set({ suggestionCache: cache })
        return parsed
      }
    } catch { /* ignore parse errors */ }

    return undefined
  },

  getCachedSuggestionsBySchema: (schemaKey: string) => {
    try {
      const stored = localStorage.getItem(`suggestions:schema:${schemaKey}`)
      if (stored) return JSON.parse(stored) as InsightSuggestion[]
    } catch { /* ignore */ }
    return undefined
  },

  cacheSuggestions: (datasetId: string, schemaKey: string, suggestions: InsightSuggestion[]) => {
    // In-memory cache
    const cache = new Map(get().suggestionCache)
    cache.set(datasetId, suggestions)
    set({ suggestionCache: cache })

    // Persist to localStorage by both dataset ID and schema key
    try {
      const json = JSON.stringify(suggestions)
      localStorage.setItem(`suggestions:${datasetId}`, json)
      localStorage.setItem(`suggestions:schema:${schemaKey}`, json)
    } catch { /* quota exceeded — non-critical */ }
  },

  fetchDatasets: async (projectId: string) => {
    set({ loading: true, error: null, datasets: [], currentDataset: null, parsedData: null })
    try {
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ datasets: data || [] })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  uploadDataset: async (projectId: string, file: File) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const content = await file.text()
      const isJson = file.name.endsWith('.json')
      const parsedData = parseData(content, isJson)
      const schema: DatasetSchema = generateSchema(parsedData)

      const filePath = `${user.id}/${projectId}/${Date.now()}_${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('datasets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data, error } = await supabase
        .from('datasets')
        .insert({
          project_id: projectId,
          file_path: filePath,
          schema_json: schema,
          row_count: schema.rowCount,
        })
        .select()
        .single()

      if (error) throw error

      set({
        datasets: [data, ...get().datasets],
        currentDataset: data,
        parsedData,
      })
      await bustProjectDatasets(projectId)
      return data
    } catch (error) {
      set({ error: (error as Error).message })
      return null
    } finally {
      set({ loading: false })
    }
  },

  deleteDataset: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const dataset = get().datasets.find(d => d.id === id)
      if (dataset) {
        await supabase.storage.from('datasets').remove([dataset.file_path])
      }

      const { error } = await supabase
        .from('datasets')
        .delete()
        .eq('id', id)

      if (error) throw error

      if (dataset) await bustProjectDatasets(dataset.project_id)

      const cache = new Map(get().suggestionCache)
      cache.delete(id)
      try { localStorage.removeItem(`suggestions:${id}`) } catch { /* ignore */ }
      set({
        datasets: get().datasets.filter((d) => d.id !== id),
        currentDataset: get().currentDataset?.id === id ? null : get().currentDataset,
        parsedData: get().currentDataset?.id === id ? null : get().parsedData,
        suggestionCache: cache,
      })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  setCurrentDataset: (dataset: Dataset | null) => {
    set({ currentDataset: dataset, parsedData: null })
  },

  loadDatasetData: async (dataset: Dataset) => {
    try {
      const { data, error } = await supabase.storage
        .from('datasets')
        .download(dataset.file_path)

      if (error) throw error

      const content = await data.text()
      const isJson = dataset.file_path.endsWith('.json')
      const parsedData = parseData(content, isJson)

      set({ parsedData, currentDataset: dataset })
      return parsedData
    } catch (error) {
      set({ error: (error as Error).message })
      return null
    }
  },
}))
