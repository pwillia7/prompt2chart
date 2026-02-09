import { useState } from 'react'

interface AnalystNotesProps {
  explanation: string
}

interface ParsedNotes {
  insight: string
  readability: string[]
  questions: string[]
  nextSteps: string[]
}

function parseNotes(raw: string): ParsedNotes | null {
  try {
    const parsed = JSON.parse(raw)
    if (parsed.insight && parsed.readability && parsed.questions && parsed.nextSteps) {
      return parsed as ParsedNotes
    }
  } catch {
    // not JSON — fall through
  }
  return null
}

function FallbackNotes({ text }: { text: string }) {
  return (
    <div className="px-3 py-2">
      <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
    </div>
  )
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

function BulletList({ items, className = '' }: { items: string[], className?: string }) {
  return (
    <ul className={`space-y-1.5 ${className}`}>
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
        <FallbackNotes text={explanation} />
      ) : (
        <div className="space-y-3">
          {/* Key Insight — always visible, highlighted */}
          <div className="px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-sm text-amber-900 leading-relaxed font-medium">{notes.insight}</p>
          </div>

          <Section
            label="How to Read This Chart"
            color="bg-blue-100 text-blue-600"
            icon={
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
          >
            <BulletList items={notes.readability} />
          </Section>

          <Section
            label="Questions to Explore"
            color="bg-violet-100 text-violet-600"
            icon={
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01" />
              </svg>
            }
          >
            <BulletList items={notes.questions} />
          </Section>

          <Section
            label="Suggested Next Steps"
            color="bg-emerald-100 text-emerald-600"
            defaultOpen={false}
            icon={
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            }
          >
            <BulletList items={notes.nextSteps} />
          </Section>
        </div>
      )}
    </div>
  )
}
