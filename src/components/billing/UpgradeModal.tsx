import { useBillingStore } from '../../store/billingStore'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { credits, packs, purchasing, purchaseCredits } = useBillingStore()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--surface-1)] rounded-modal shadow-medium border border-[var(--border)] max-w-lg w-full mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-subtle)] hover:text-[var(--text-muted)] transition-colors duration-fast"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-semibold text-[var(--text)] mb-1">Buy Credits</h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          You have <span className="font-medium text-[var(--text)]">{credits ?? 0}</span> credits remaining.
          Each chart generation or analyst chat message costs 1 credit.
        </p>

        <div className="space-y-3">
          {packs.map((pack) => (
            <button
              key={pack.id}
              disabled={purchasing}
              onClick={() => purchaseCredits(pack.id)}
              className="w-full flex items-center justify-between p-4 border border-[var(--border)] rounded-card bg-[var(--surface-1)] hover:border-[var(--primary)]/40 hover:bg-[var(--surface-2)] transition-all duration-fast disabled:opacity-50 text-left"
            >
              <div>
                <div className="font-semibold text-[var(--text)]">{pack.name}</div>
                <div className="text-sm text-[var(--text-muted)]">{pack.credits} credits</div>
              </div>
              <div className="text-lg font-bold text-[var(--text)]">
                ${(pack.priceUsd / 100).toFixed(0)}
              </div>
            </button>
          ))}
        </div>

        {packs.length === 0 && (
          <p className="text-sm text-[var(--text-muted)] text-center py-4">
            Credit packs are not available yet. Check back soon.
          </p>
        )}
      </div>
    </div>
  )
}
