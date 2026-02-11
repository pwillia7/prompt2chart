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
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        isLow
          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
          : 'text-gray-600 hover:bg-gray-100'
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
