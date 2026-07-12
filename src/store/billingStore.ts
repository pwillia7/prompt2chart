import { create } from 'zustand'
import { track } from '../lib/analytics'

interface CreditPack {
  id: string
  name: string
  credits: number
  priceUsd: number
}

interface BillingState {
  credits: number | null
  packs: CreditPack[]
  loading: boolean
  purchasing: boolean
  fetchCredits: () => Promise<void>
  purchaseCredits: (packId: string) => Promise<void>
  setCredits: (credits: number) => void
}

export const useBillingStore = create<BillingState>((set) => ({
  credits: null,
  packs: [],
  loading: false,
  purchasing: false,

  fetchCredits: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/get-credits', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Failed to fetch credits (${res.status})`)
      set({ credits: data.balance, packs: data.packs || [] })
    } catch (error) {
      console.error('Failed to fetch credits:', error)
    } finally {
      set({ loading: false })
    }
  },

  purchaseCredits: async (packId: string) => {
    set({ purchasing: true })
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || `Failed to create checkout session (${res.status})`)
      if (data?.url) {
        track('credit-purchase', { pack: packId })
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error)
    } finally {
      set({ purchasing: false })
    }
  },

  setCredits: (credits: number) => set({ credits }),
}))
