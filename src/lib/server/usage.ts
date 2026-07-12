import { createSupabaseAdminClient } from './supabase-admin'

// Rate limit: count a user's usage_events for an eventType in the last minute.
export async function checkRateLimit(
  userId: string,
  eventType: string,
  maxPerMinute: number,
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  const admin = createSupabaseAdminClient()
  const now = Date.now()
  const oneMinuteAgo = new Date(now - 60 * 1000).toISOString()

  const { data, count, error } = await admin
    .from('usage_events')
    .select('created_at', { count: 'exact' })
    .eq('user_id', userId)
    .eq('event_type', eventType)
    .gte('created_at', oneMinuteAgo)
    .order('created_at', { ascending: true })
    .limit(1)

  if (error) {
    console.error('Rate limit check failed:', error)
    // Fail open — don't block users if the rate-limit check errors
    return { allowed: true, remaining: maxPerMinute, retryAfterSeconds: 0 }
  }

  const used = count ?? 0
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

export async function logUsageEvent(
  userId: string,
  eventType: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const admin = createSupabaseAdminClient()
  await admin.from('usage_events').insert({ user_id: userId, event_type: eventType, metadata })
}
