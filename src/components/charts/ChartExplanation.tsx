interface ChartExplanationProps {
  explanation: string
  chartType?: string
}

export function ChartExplanation({ explanation, chartType }: ChartExplanationProps) {
  return (
    <div className="bg-[var(--surface-1)] rounded-card p-4 border border-[var(--border)]">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-[var(--primary)] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-[var(--text)]">AI Explanation</h4>
            {chartType && (
              <span className="px-2 py-0.5 bg-[var(--surface-3)] text-[var(--text-muted)] text-xs font-medium rounded-pill">
                {chartType}
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-muted)]">{explanation}</p>
        </div>
      </div>
    </div>
  )
}
