import { useState } from 'react'

interface AnalystNotesProps {
  explanation: string
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

export function AnalystNotes({ explanation }: AnalystNotesProps) {
  const notes = parseNotes(explanation)

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
            <BulletList items={notes.suggestions} />
          </Section>
        </div>
      )}
    </div>
  )
}
