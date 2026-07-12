import { requireUser } from '@/lib/server/auth'
import { checkCredits, deductCredits } from '@/lib/server/credits'
import { checkRateLimit, logUsageEvent } from '@/lib/server/usage'
import { handleRouteError } from '@/lib/server/respond'
import { generateChart } from '@/lib/llm/client'
import type { DatasetSchema, ChartLibrary } from '@/types'
import type { AllSchemaEntry } from '@/lib/llm/types'

export const maxDuration = 60

const MAX_PROMPT_LENGTH = 4000
const MAX_BODY_SIZE = 100_000 // 100KB
const RATE_LIMIT_PER_MINUTE = 20

interface GenerateChartBody {
  prompt: string
  schema: DatasetSchema
  library?: ChartLibrary
  existingCode?: string | null
  allSchemas?: AllSchemaEntry[]
}

export async function POST(req: Request) {
  try {
    const user = await requireUser()

    const raw = await req.text()
    if (raw.length > MAX_BODY_SIZE) {
      return Response.json({ error: 'Request body too large' }, { status: 413 })
    }

    const { prompt, schema, library, existingCode, allSchemas } = JSON.parse(raw) as GenerateChartBody

    if (!prompt || !schema) {
      return Response.json({ error: 'Missing required fields: prompt and schema' }, { status: 400 })
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return Response.json(
        { error: `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters` },
        { status: 400 },
      )
    }

    const { allowed, remaining, retryAfterSeconds } = await checkRateLimit(
      user.id,
      'chart_generation',
      RATE_LIMIT_PER_MINUTE,
    )
    if (!allowed) {
      return Response.json(
        { error: `Rate limit exceeded. Please wait ${retryAfterSeconds} seconds before generating more charts.` },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
      )
    }

    // Verify balance, don't deduct yet
    await checkCredits(user.id, 'generate-chart')

    const response = await generateChart(
      prompt,
      schema,
      library || 'vega-lite',
      existingCode || undefined,
      allSchemas,
      user.id,
    )

    // Deduct only after a successful generation
    const creditsRemaining = await deductCredits(user.id, 'generate-chart', { library: library || 'vega-lite' })

    await logUsageEvent(user.id, 'chart_generation', {
      library: library || 'vega-lite',
      hasExistingCode: !!existingCode,
      remaining: remaining - 1,
    })

    return Response.json({ ...response, creditsRemaining })
  } catch (error) {
    return handleRouteError(error)
  }
}
