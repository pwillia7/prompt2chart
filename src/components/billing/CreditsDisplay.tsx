import { useEffect } from 'react'
import { useBillingStore } from '../../store/billingStore'

interface CreditsDisplayProps {
  onUpgrade: () => void
}

export function CreditsDisplay({ onUpgrade }: CreditsDisplayProps) {
  const { credits, loading, fetchCredits } = useBillingStore()

  useEffect(() => {
    fetchCredits()
  }, [fetchCredits])

  if (loading && credits === null) return null

  const isLow = credits !== null && credits <= 3

  return (
    <button
      onClick={onUpgrade}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-sm font-medium transition-colors duration-fast ${
        isLow
          ? 'bg-[var(--warning)]/10 text-amber-400 hover:bg-[var(--warning)]/15 border border-[var(--warning)]/20'
          : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
      }`}
      title="Click to buy more credits"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      {credits ?? '...'} credits
    </button>
  )
}
