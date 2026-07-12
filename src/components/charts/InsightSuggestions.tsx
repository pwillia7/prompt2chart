import { useEffect, useState } from 'react'
import { getSampleSuggestions } from '../../lib/sampleData'
import { AllSchemaEntry } from '../../store/chartStore'
import { useDatasetStore } from '../../store/datasetStore'
import { ChartLibrary, DatasetSchema, InsightSuggestion } from '../../types'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'

const INITIAL_VISIBLE = 3

interface InsightSuggestionsProps {
  datasetId: string
  schema: DatasetSchema
  allSchemas?: AllSchemaEntry[]
  onSelectSuggestion: (prompt: string, library?: ChartLibrary) => void
  disabled?: boolean
}

function getSchemaKey(schema: DatasetSchema): string {
  const cols = schema.columns
    .map(c => `${c.name}:${c.type}`)
    .sort()
    .join('|')
  return cols
}

export function InsightSuggestions({ datasetId, schema, allSchemas, onSelectSuggestion, disabled }: InsightSuggestionsProps) {
  const { getCachedSuggestions, getCachedSuggestionsBySchema, cacheSuggestions } = useDatasetStore()
  const schemaKey = getSchemaKey(schema)
  const columnNames = schema.columns.map(c => c.name)
  const [suggestions, setSuggestions] = useState<InsightSuggestion[]>(() => {
    return getSampleSuggestions(columnNames) || getCachedSuggestions(datasetId) || getCachedSuggestionsBySchema(schemaKey) || []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    // Check hardcoded sample suggestions first (zero API calls)
    const sampleSuggestions = getSampleSuggestions(columnNames)
    if (sampleSuggestions) {
      setSuggestions(sampleSuggestions)
      return
    }

    // Check dataset-level cache
    const cached = getCachedSuggestions(datasetId)
    if (cached) {
      setSuggestions(cached)
      return
    }

    // Check schema-level cache (covers same data across projects)
    const schemaCached = getCachedSuggestionsBySchema(schemaKey)
    if (schemaCached) {
      // Promote to dataset-level cache
      cacheSuggestions(datasetId, schemaKey, schemaCached)
      setSuggestions(schemaCached)
      return
    }

    if (schema.columns.length === 0) return

    let cancelled = false

    async function fetchSuggestions() {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/suggest-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schema, allSchemas }),
        })

        const payload = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(payload?.error || `Request failed (${res.status})`)
        if (!cancelled) {
          const results = payload.suggestions || []
          cacheSuggestions(datasetId, schemaKey, results)
          setSuggestions(results)
          setExpanded(false)
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchSuggestions()
    return () => { cancelled = true }
  }, [datasetId])

  const visibleSuggestions = expanded ? suggestions : suggestions.slice(0, INITIAL_VISIBLE)
  const hasMore = suggestions.length > INITIAL_VISIBLE

  return (
    <div className="min-h-[88px]">
      {loading && suggestions.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] py-2">
          <Spinner size="sm" />
          <span>Generating visualization suggestions...</span>
        </div>
      ) : error ? (
        <div className="text-sm text-amber-400 py-2">
          Could not generate suggestions: {error}
        </div>
      ) : suggestions.length === 0 ? null : (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-[var(--text-muted)]">Suggested Visualizations</h4>
          <div className="flex flex-wrap gap-2">
            {visibleSuggestions.map((suggestion, idx) => (
              <Button
                key={idx}
                variant="secondary"
                size="sm"
                onClick={() => onSelectSuggestion(suggestion.prompt, suggestion.library)}
                disabled={disabled}
                className="text-left"
              >
                <span className="flex items-center gap-2">
                  <ChartTypeIcon type={suggestion.chartType} />
                  <span>{suggestion.description}</span>
                  {suggestion.library && (
                    <span className={`px-1.5 py-0.5 text-xs rounded-pill ${
                      suggestion.library === 'd3'
                        ? 'bg-orange-500/15 text-orange-400'
                        : 'bg-[var(--surface-3)] text-[var(--text-muted)]'
                    }`}>
                      {suggestion.library === 'd3' ? 'D3' : 'VL'}
                    </span>
                  )}
                </span>
              </Button>
            ))}
            {hasMore && !expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="text-xs text-[var(--text-subtle)] hover:text-[var(--text-muted)] px-2 py-1 transition-colors duration-fast"
              >
                Show {suggestions.length - INITIAL_VISIBLE} more...
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ChartTypeIcon({ type }: { type: string }) {
  const iconClass = 'w-4 h-4'

  switch (type.toLowerCase()) {
    case 'bar':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <rect x="4" y="8" width="4" height="12" />
          <rect x="10" y="4" width="4" height="16" />
          <rect x="16" y="12" width="4" height="8" />
        </svg>
      )
    case 'line':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 18l4-4 4 4 8-8" />
        </svg>
      )
    case 'scatter':
    case 'point':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <circle cx="6" cy="18" r="2" />
          <circle cx="12" cy="10" r="2" />
          <circle cx="18" cy="14" r="2" />
          <circle cx="8" cy="6" r="2" />
        </svg>
      )
    case 'pie':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2v10l8.66 5a10 10 0 11-8.66-15z" />
        </svg>
      )
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
  }
}
