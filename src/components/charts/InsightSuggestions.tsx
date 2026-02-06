import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ChartLibrary, DatasetSchema, InsightSuggestion } from '../../types'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'

interface InsightSuggestionsProps {
  schema: DatasetSchema
  onSelectSuggestion: (prompt: string, library?: ChartLibrary) => void
  disabled?: boolean
}

export function InsightSuggestions({ schema, onSelectSuggestion, disabled }: InsightSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<InsightSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSuggestions() {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fnError } = await supabase.functions.invoke('suggest-insights', {
          body: { schema },
        })

        if (fnError) throw fnError
        setSuggestions(data.suggestions || [])
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    if (schema.columns.length > 0) {
      fetchSuggestions()
    }
  }, [schema])

  if (loading) {
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
        {suggestions.map((suggestion, idx) => (
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
