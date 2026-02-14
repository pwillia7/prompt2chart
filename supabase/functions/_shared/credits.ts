import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// Credit costs per operation (suggest-insights is free)
export const CREDIT_COSTS = {
  'generate-chart': 1,
  'analyst-chat': 1,
} as const

export type CreditOperation = keyof typeof CREDIT_COSTS

export class InsufficientCreditsError extends Error {
  status = 402
  remaining: number
  constructor(remaining: number) {
    super(`Insufficient credits. You have ${remaining} credits remaining.`)
    this.name = 'InsufficientCreditsError'
    this.remaining = remaining
  }
}

/**
 * Check that a user has enough credits for an operation.
 * Throws InsufficientCreditsError if not. Does NOT deduct.
 */
export async function checkCredits(
  userId: string,
  operation: CreditOperation,
): Promise<void> {
  const balance = await getCredits(userId)
  const cost = CREDIT_COSTS[operation]
  if (balance < cost) {
    throw new InsufficientCreditsError(balance)
  }
}

/**
 * Deduct credits atomically. Throws InsufficientCreditsError if
 * the user doesn't have enough credits.
 * Call this AFTER a successful operation, not before.
 */
export async function useCredits(
  userId: string,
  operation: CreditOperation,
  metadata: Record<string, unknown> = {},
): Promise<number> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const cost = CREDIT_COSTS[operation]

  const { data, error } = await adminClient.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: cost,
    p_reason: operation,
    p_metadata: metadata,
  })

  if (error) {
    console.error('Credit deduction failed:', error)
    // Fail open — don't block users if credits check errors
    return -1
  }

  const row = data?.[0]
  if (!row?.success) {
    throw new InsufficientCreditsError(row?.remaining ?? 0)
  }

  return row.remaining
}

/**
 * Get a user's current credit balance.
 */
export async function getCredits(userId: string): Promise<number> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data, error } = await adminClient
    .from('user_credits')
    .select('balance')
    .eq('user_id', userId)
    .single()

  if (error || !data) return 0
  return data.balance
}

// Stripe credit pack definitions
export const CREDIT_PACKS = [
  { id: 'starter', name: 'Starter', credits: 100, priceUsd: 500 },
  { id: 'pro', name: 'Pro', credits: 300, priceUsd: 1500 },
  { id: 'power', name: 'Power', credits: 800, priceUsd: 3000 },
] as const
