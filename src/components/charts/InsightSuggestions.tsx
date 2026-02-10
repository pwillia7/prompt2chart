import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { AllSchemaEntry } from '../../store/chartStore'
import { ChartLibrary, DatasetSchema, InsightSuggestion } from '../../types'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'

const INITIAL_VISIBLE = 3

interface InsightSuggestionsProps {
  schema: DatasetSchema
  allSchemas?: AllSchemaEntry[]
  onSelectSuggestion: (prompt: string, library?: ChartLibrary) => void
  disabled?: boolean
}

export function InsightSuggestions({ schema, allSchemas, onSelectSuggestion, disabled }: InsightSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<InsightSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const fetchedKeyRef = useRef<string | null>(null)

  // Stable string key so useEffect only fires when schema content actually changes
  const schemaKey = useMemo(() => JSON.stringify(schema), [schema])

  useEffect(() => {
    if (fetchedKeyRef.current === schemaKey) return
    if (schema.columns.length === 0) return

    let cancelled = false
    fetchedKeyRef.current = schemaKey

    async function fetchSuggestions() {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fnError } = await supabase.functions.invoke('suggest-insights', {
          body: { schema, allSchemas },
        })

        if (fnError) throw fnError
        if (!cancelled) {
          setSuggestions(data.suggestions || [])
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
  }, [schemaKey, schema, allSchemas])

  const visibleSuggestions = expanded ? suggestions : suggestions.slice(0, INITIAL_VISIBLE)
  const hasMore = suggestions.length > INITIAL_VISIBLE

  if (loading && suggestions.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Spinner size="sm" />
        <span>Generating visualization suggestions...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-amber-600">
        Could not generate suggestions: {error}
      </div>
    )
  }

  if (suggestions.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">Suggested Visualizations</h4>
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
                <span className={`px-1.5 py-0.5 text-xs rounded ${
                  suggestion.library === 'd3'
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-blue-100 text-blue-600'
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
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
          >
            Show {suggestions.length - INITIAL_VISIBLE} more...
          </button>
        )}
      </div>
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
