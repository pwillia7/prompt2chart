import { create } from 'zustand'
import { supabase } from '../lib/supabase'
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
      const { data, error } = await supabase.functions.invoke('get-credits')
      if (error) throw error
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
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { packId },
      })
      if (error) throw error
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
