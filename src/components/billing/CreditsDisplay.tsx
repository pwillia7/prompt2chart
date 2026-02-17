import { useEffect } from 'react'
import { Link } from 'react-router-dom'
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
    <div className="flex items-center gap-1">
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
      <Link
        to="/pricing"
        className="text-[var(--text-subtle)] hover:text-[var(--text-muted)] transition-colors duration-fast p-1"
        title="How credits work"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </Link>
    </div>
  )
}
