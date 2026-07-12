import { requireUser } from '@/lib/server/auth'
import { checkCredits, deductCredits } from '@/lib/server/credits'
import { checkRateLimit, logUsageEvent } from '@/lib/server/usage'
import { handleRouteError } from '@/lib/server/respond'
import { analystChat } from '@/lib/llm/client'
import { buildAnalystSystemPrompt } from '@/lib/llm/analyst'
import type { DatasetSchema, ChartLibrary } from '@/types'
import type { AllSchemaEntry, ChatMessage } from '@/lib/llm/types'

export const maxDuration = 60

const MAX_MESSAGE_LENGTH = 2000
const MAX_HISTORY_MESSAGES = 10
const RATE_LIMIT_PER_MINUTE = 20

interface AnalystChatBody {
  message: string
  schema: DatasetSchema
  chartLibrary: ChartLibrary
  chartCode?: string
  vegaSpec?: string
  explanation?: string
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
  allSchemas?: AllSchemaEntry[]
}

export async function POST(req: Request) {
  try {
    const user = await requireUser()

    const { message, schema, chartLibrary, chartCode, vegaSpec, explanation, conversationHistory, allSchemas } =
      (await req.json()) as AnalystChatBody

    if (!message || !schema) {
      return Response.json({ error: 'Missing required fields: message and schema' }, { status: 400 })
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return Response.json(
        { error: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters` },
        { status: 400 },
      )
    }

    const { allowed, retryAfterSeconds } = await checkRateLimit(user.id, 'analyst_chat', RATE_LIMIT_PER_MINUTE)
    if (!allowed) {
      return Response.json(
        { error: `Rate limit exceeded. Please wait ${retryAfterSeconds} seconds before sending more messages.` },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
      )
    }

    await checkCredits(user.id, 'analyst-chat')

    const systemPrompt = buildAnalystSystemPrompt(schema, chartLibrary, chartCode, vegaSpec, explanation, allSchemas)
    const truncatedHistory = (conversationHistory || []).slice(-MAX_HISTORY_MESSAGES)
    const messages: ChatMessage[] = [
      ...truncatedHistory.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: message },
    ]

    const reply = await analystChat(systemPrompt, messages, user.id)

    await deductCredits(user.id, 'analyst-chat')
    await logUsageEvent(user.id, 'analyst_chat')

    return Response.json({ reply })
  } catch (error) {
    return handleRouteError(error)
  }
}
