import { createSupabaseAdminClient } from './supabase-admin'

// Credit costs per operation (suggest-insights is free)
export const CREDIT_COSTS = {
  'generate-chart': 1,
  'analyst-chat': 1,
} as const

export type CreditOperation = keyof typeof CREDIT_COSTS

// Stripe credit pack definitions (ported from the Supabase _shared/credits.ts)
export const CREDIT_PACKS = [
  { id: 'starter', name: 'Starter', credits: 100, priceUsd: 500 },
  { id: 'pro', name: 'Pro', credits: 300, priceUsd: 1500 },
  { id: 'power', name: 'Power', credits: 800, priceUsd: 3000 },
] as const

export class InsufficientCreditsError extends Error {
  status = 402
  remaining: number
  constructor(remaining: number) {
    super(`Insufficient credits. You have ${remaining} credits remaining.`)
    this.name = 'InsufficientCreditsError'
    this.remaining = remaining
  }
}

export async function getCredits(userId: string): Promise<number> {
  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from('user_credits')
    .select('balance')
    .eq('user_id', userId)
    .single()
  if (error || !data) return 0
  return data.balance
}

/** Lazily grant monthly free credits if eligible. Non-blocking (logs on error). */
export async function grantMonthlyCredits(userId: string): Promise<void> {
  const admin = createSupabaseAdminClient()
  const { error } = await admin.rpc('grant_monthly_credits', { p_user_id: userId })
  if (error) console.error('Monthly credit grant failed (non-blocking):', error)
}

/** Verify balance without deducting. Throws InsufficientCreditsError if short. */
export async function checkCredits(userId: string, operation: CreditOperation): Promise<void> {
  const balance = await getCredits(userId)
  if (balance < CREDIT_COSTS[operation]) {
    throw new InsufficientCreditsError(balance)
  }
}

/** Deduct atomically via the deduct_credits RPC. Call AFTER a successful op. */
export async function deductCredits(
  userId: string,
  operation: CreditOperation,
  metadata: Record<string, unknown> = {},
): Promise<number> {
  const admin = createSupabaseAdminClient()
  const { data, error } = await admin.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: CREDIT_COSTS[operation],
    p_reason: operation,
    p_metadata: metadata,
  })
  if (error) {
    console.error('Credit deduction failed:', error)
    // Fail open — don't block users if credit deduction errors
    return -1
  }
  const row = data?.[0]
  if (!row?.success) {
    throw new InsufficientCreditsError(row?.remaining ?? 0)
  }
  return row.remaining
}
