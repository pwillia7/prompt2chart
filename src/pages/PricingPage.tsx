import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { useBillingStore } from '../store/billingStore'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { track } from '../lib/analytics'

export function PricingPage() {
  useDocumentTitle('Pricing - Prompt2Chart')
  const navigate = useNavigate()
  const { credits, packs, purchasing, fetchCredits, purchaseCredits } = useBillingStore()

  useEffect(() => {
    track('pricing-viewed')
    fetchCredits()
  }, [fetchCredits])

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-[var(--text-muted)] hover:text-[var(--text)] mb-6 text-sm transition-colors duration-fast"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Simple, transparent pricing</h1>
        <p className="text-sm text-[var(--text-muted)] mb-8">
          No subscriptions, no hidden fees. You always know exactly what you're paying for.
        </p>

        {/* Free tier */}
        <div className="bg-[var(--surface-1)] rounded-card border border-[var(--border)] p-5 mb-6">
          <h2 className="font-semibold text-[var(--text)] mb-3">What's included free</h2>
          <ul className="space-y-2 text-sm text-[var(--text-muted)]">
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span><span className="font-medium text-[var(--text)]">100 credits</span> when you sign up</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span><span className="font-medium text-[var(--text)]">25 free credits</span> added every month</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Unlimited dataset uploads, projects, and exports</span>
            </li>
          </ul>
        </div>

        {/* What costs a credit */}
        <div className="bg-[var(--surface-1)] rounded-card border border-[var(--border)] p-5 mb-6">
          <h2 className="font-semibold text-[var(--text)] mb-3">What costs a credit</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <span>Chart generation</span>
              <span className="font-medium text-[var(--text)]">1 credit</span>
            </div>
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <span>Analyst chat message</span>
              <span className="font-medium text-[var(--text)]">1 credit</span>
            </div>
            <div className="border-t border-[var(--border)] my-3" />
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <span>Dataset uploads & browsing</span>
              <span className="text-green-400 font-medium">Free</span>
            </div>
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <span>PNG, SVG, and HTML exports</span>
              <span className="text-green-400 font-medium">Free</span>
            </div>
          </div>
        </div>

        {/* Credit packs */}
        <div className="mb-8">
          <h2 className="font-semibold text-[var(--text)] mb-1">Need more credits?</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            You have <span className="font-medium text-[var(--text)]">{credits ?? 0}</span> credits remaining. Buy more anytime.
          </p>
          <div className="space-y-3">
            {packs.map((pack) => (
              <button
                key={pack.id}
                disabled={purchasing}
                onClick={() => { track('credit-pack-selected', { pack: pack.id }); purchaseCredits(pack.id) }}
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
            <p className="text-sm text-[var(--text-muted)] text-center py-4 bg-[var(--surface-1)] rounded-card border border-[var(--border)]">
              Credit packs are loading...
            </p>
          )}
        </div>

        {/* FAQ */}
        <h2 className="font-semibold text-[var(--text)] mb-4">Common questions</h2>
        <div className="space-y-3 mb-8">
          <div className="bg-[var(--surface-1)] rounded-card border border-[var(--border)] p-4">
            <h3 className="text-sm font-medium text-[var(--text)] mb-1">What if I run out of credits?</h3>
            <p className="text-sm text-[var(--text-muted)]">
              You'll receive 25 free credits every month, automatically. You can also purchase additional credit packs at any time with no commitment.
            </p>
          </div>
          <div className="bg-[var(--surface-1)] rounded-card border border-[var(--border)] p-4">
            <h3 className="text-sm font-medium text-[var(--text)] mb-1">Is my data secure?</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Your datasets are stored in private, isolated storage. They are never shared with other users or used to train models.
            </p>
          </div>
          <div className="bg-[var(--surface-1)] rounded-card border border-[var(--border)] p-4">
            <h3 className="text-sm font-medium text-[var(--text)] mb-1">Do I need a subscription?</h3>
            <p className="text-sm text-[var(--text-muted)]">
              No. There's nothing to cancel. Free credits refill monthly, and you only buy more if and when you need them.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
