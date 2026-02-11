import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

/**
 * Extract and verify the authenticated user from a request.
 * Returns { user, supabaseClient } or throws with a descriptive message.
 */
export async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    throw new AuthError('Missing Authorization header', 401)
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user }, error } = await supabaseClient.auth.getUser()
  if (error || !user) {
    throw new AuthError('Invalid or expired token', 401)
  }

  return { user, supabaseClient }
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

// Rate limit check: count recent usage_events for a user in the given window
export async function checkRateLimit(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
  eventType: string,
  maxPerHour: number,
): Promise<{ allowed: boolean; remaining: number }> {
  // Use service role client for rate limit checks (bypasses RLS)
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { count, error } = await adminClient
    .from('usage_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', eventType)
    .gte('created_at', oneHourAgo)

  if (error) {
    console.error('Rate limit check failed:', error)
    // Fail open — don't block users if rate limit check errors
    return { allowed: true, remaining: maxPerHour }
  }

  const used = count ?? 0
  return { allowed: used < maxPerHour, remaining: Math.max(0, maxPerHour - used) }
}

// Log a usage event (for rate limiting and billing)
export async function logUsageEvent(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
  eventType: string,
  metadata: Record<string, unknown> = {},
) {
  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  await adminClient.from('usage_events').insert({
    user_id: userId,
    event_type: eventType,
    metadata,
  })
}
