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
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-1">Buy Credits</h2>
        <p className="text-sm text-gray-500 mb-6">
          You have <span className="font-medium text-gray-900">{credits ?? 0}</span> credits remaining.
          Each chart generation, insight suggestion, or analyst chat message costs 1 credit.
        </p>

        <div className="space-y-3">
          {packs.map((pack) => (
            <button
              key={pack.id}
              disabled={purchasing}
              onClick={() => purchaseCredits(pack.id)}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-colors disabled:opacity-50 text-left"
            >
              <div>
                <div className="font-semibold text-gray-900">{pack.name}</div>
                <div className="text-sm text-gray-500">{pack.credits} credits</div>
              </div>
              <div className="text-lg font-bold text-gray-900">
                ${(pack.priceUsd / 100).toFixed(0)}
              </div>
            </button>
          ))}
        </div>

        {packs.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            Credit packs are not available yet. Check back soon.
          </p>
        )}
      </div>
    </div>
  )
}
