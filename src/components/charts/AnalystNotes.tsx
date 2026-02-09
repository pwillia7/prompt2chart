import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { supabase } from '../../lib/supabase'
import { useChartStore } from '../../store/chartStore'
import type { Chart, DatasetSchema } from '../../types'

interface AnalystNotesProps {
  explanation: string
  chart?: Chart | null
  schema?: DatasetSchema
  onSuggestionClick?: (prompt: string) => void
}

interface ParsedNotes {
  chartInsights: string[]
  dataInsights: string[]
  suggestions: string[]
}


function parseNotes(raw: string): ParsedNotes | null {
  try {
    const parsed = JSON.parse(raw)
    if (parsed.chartInsights && parsed.dataInsights && parsed.suggestions) {
      return parsed as ParsedNotes
    }
  } catch {
    // not JSON — fall through
  }
  return null
}

function Section({ icon, label, color, children, defaultOpen = true }: {
  icon: React.ReactNode
  label: string
  color: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
      >
        <span className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center ${color}`}>
          {icon}
        </span>
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex-1">{label}</span>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="mt-1 ml-10 mr-2">{children}</div>}
    </div>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-gray-600 leading-snug">
          <span className="flex-shrink-0 mt-1.5 w-1 h-1 rounded-full bg-gray-400" />
          {item}
        </li>
      ))}
    </ul>
  )
}

function PulsingDots() {
  return (
    <div className="flex gap-1 py-2 px-1">
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" />
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse [animation-delay:300ms]" />
    </div>
  )
}

export function AnalystNotes({ explanation, chart, schema, onSuggestionClick }: AnalystNotesProps) {
  const notes = parseNotes(explanation)
  const { getAnalystChat, setAnalystChat } = useChartStore()
  const messages = chart ? getAnalystChat(chart.id) : []
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length, loading])

  const updateMessages = useCallback((chartId: string, updater: (prev: typeof messages) => typeof messages) => {
    setAnalystChat(chartId, updater(getAnalystChat(chartId)))
  }, [getAnalystChat, setAnalystChat])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading || !chart || !schema) return

    updateMessages(chart.id, prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)

    try {
      const currentMessages = getAnalystChat(chart.id)
      const conversationHistory = currentMessages.map(m => ({
        role: m.role === 'analyst' ? 'assistant' as const : 'user' as const,
        content: m.content,
      }))

      const { data, error } = await supabase.functions.invoke('analyst-chat', {
        body: {
          message: text,
          schema,
          chartLibrary: chart.chart_library,
          chartCode: chart.chart_library === 'd3' ? chart.d3_code : undefined,
          vegaSpec: chart.vega_spec_json
            ? JSON.stringify((() => { const { data: _, ...rest } = chart.vega_spec_json!; return rest })())
            : undefined,
          conversationHistory,
        },
      })

      if (error) throw error

      updateMessages(chart.id, prev => [...prev, { role: 'analyst', content: data.reply }])
    } catch (err) {
      updateMessages(chart.id, prev => [...prev, { role: 'analyst', content: `Error: ${(err as Error).message}` }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
        </svg>
        <h3 className="text-sm font-semibold text-gray-900">Analyst Notes</h3>
      </div>

      {!notes ? (
        <div className="px-3 py-2">
          <p className="text-sm text-gray-600 leading-relaxed">{explanation}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Section
            label="Chart Insights"
            color="bg-blue-100 text-blue-600"
            icon={
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          >
            <BulletList items={notes.chartInsights} />
          </Section>

          <Section
            label="Dataset Insights"
            color="bg-violet-100 text-violet-600"
            icon={
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            }
          >
            <BulletList items={notes.dataInsights} />
          </Section>

          <Section
            label="Suggestions"
            color="bg-emerald-100 text-emerald-600"
            icon={
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
          >
            {onSuggestionClick ? (
              <div className="flex flex-wrap gap-1.5">
                {notes.suggestions.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => onSuggestionClick(item)}
                    className="text-left text-sm text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer leading-snug"
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : (
              <BulletList items={notes.suggestions} />
            )}
          </Section>
        </div>
      )}

      {/* Chat interface */}
      {chart && (
        <div className="mt-4 border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ask the Analyst</span>
          </div>

          {messages.length > 0 && (
            <div ref={scrollRef} className="max-h-60 overflow-y-auto space-y-2 mb-2">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-snug ${
                      msg.role === 'user'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-blue-50 text-gray-700'
                    }`}
                  >
                    {msg.role === 'analyst' ? (
                      <div className="prose-chat">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <span>{msg.content}</span>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-blue-50 rounded-lg px-3">
                    <PulsingDots />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={schema ? "Ask about patterns, outliers, next steps..." : "Loading dataset..."}
              className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              disabled={loading || !schema}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || !schema}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
