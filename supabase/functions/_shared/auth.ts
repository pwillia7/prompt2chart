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
  maxPerMinute: number,
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  // Use service role client for rate limit checks (bypasses RLS)
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const now = Date.now()
  const oneMinuteAgo = new Date(now - 60 * 1000).toISOString()

  const { data, count, error } = await adminClient
    .from('usage_events')
    .select('created_at', { count: 'exact' })
    .eq('user_id', userId)
    .eq('event_type', eventType)
    .gte('created_at', oneMinuteAgo)
    .order('created_at', { ascending: true })
    .limit(1)

  if (error) {
    console.error('Rate limit check failed:', error)
    // Fail open — don't block users if rate limit check errors
    return { allowed: true, remaining: maxPerMinute, retryAfterSeconds: 0 }
  }

  const used = count ?? 0
  // Calculate seconds until the oldest event in the window expires
  let retryAfterSeconds = 60
  if (data && data.length > 0) {
    const oldestEventTime = new Date(data[0].created_at).getTime()
    retryAfterSeconds = Math.max(1, Math.ceil((oldestEventTime + 60 * 1000 - now) / 1000))
  }

  return {
    allowed: used < maxPerMinute,
    remaining: Math.max(0, maxPerMinute - used),
    retryAfterSeconds,
  }
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
