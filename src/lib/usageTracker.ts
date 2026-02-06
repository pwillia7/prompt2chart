import { supabase } from './supabase'

export type UsageEventType = 'chart_generation' | 'dataset_upload' | 'llm_call'

interface TrackEventOptions {
  eventType: UsageEventType
  metadata?: Record<string, unknown>
}

export async function trackUsage({ eventType, metadata = {} }: TrackEventOptions): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('usage_events').insert({
      user_id: user.id,
      event_type: eventType,
      metadata,
    })
  } catch (error) {
    // Silently fail - usage tracking shouldn't break the app
    console.warn('Failed to track usage:', error)
  }
}

export async function getUsageStats(userId: string): Promise<Record<UsageEventType, number>> {
  const stats: Record<UsageEventType, number> = {
    chart_generation: 0,
    dataset_upload: 0,
    llm_call: 0,
  }

  try {
    const { data, error } = await supabase
      .from('usage_events')
      .select('event_type')
      .eq('user_id', userId)

    if (error) throw error

    for (const event of data || []) {
      const eventType = event.event_type as UsageEventType
      if (eventType in stats) {
        stats[eventType]++
      }
    }
  } catch (error) {
    console.warn('Failed to get usage stats:', error)
  }

  return stats
}
