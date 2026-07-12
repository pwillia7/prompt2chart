import { requireUser } from '@/lib/server/auth'
import { checkRateLimit, logUsageEvent } from '@/lib/server/usage'
import { handleRouteError } from '@/lib/server/respond'
import { suggestInsights } from '@/lib/llm/client'
import type { DatasetSchema } from '@/types'
import type { AllSchemaEntry } from '@/lib/llm/types'

export const maxDuration = 60

const RATE_LIMIT_PER_MINUTE = 20

interface SuggestInsightsBody {
  schema: DatasetSchema
  allSchemas?: AllSchemaEntry[]
}

// Suggestions are free — no credit check.
export async function POST(req: Request) {
  try {
    const user = await requireUser()

    const { schema, allSchemas } = (await req.json()) as SuggestInsightsBody

    if (!schema || !schema.columns) {
      return Response.json({ error: 'Missing required field: schema' }, { status: 400 })
    }

    const { allowed, retryAfterSeconds } = await checkRateLimit(user.id, 'suggest_insights', RATE_LIMIT_PER_MINUTE)
    if (!allowed) {
      return Response.json(
        { error: `Rate limit exceeded. Please wait ${retryAfterSeconds} seconds before requesting more suggestions.` },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
      )
    }

    const suggestions = await suggestInsights(schema, allSchemas, user.id)

    await logUsageEvent(user.id, 'suggest_insights')

    return Response.json({ suggestions })
  } catch (error) {
    return handleRouteError(error)
  }
}
