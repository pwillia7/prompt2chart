import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { getAuthenticatedUser, AuthError, checkRateLimit, logUsageEvent } from '../_shared/auth.ts'
import { useCredits, InsufficientCreditsError } from '../_shared/credits.ts'
import { analystChatWithRetry, ChatMessage, DatasetSchema, ChartLibrary, AllSchemaEntry } from '../_shared/llm-adapter.ts'

interface AnalystChatRequest {
  message: string
  schema: DatasetSchema
  chartLibrary: ChartLibrary
  chartCode?: string
  vegaSpec?: string
  explanation?: string
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
  allSchemas?: AllSchemaEntry[]
}

const MAX_MESSAGE_LENGTH = 2000
const MAX_HISTORY_MESSAGES = 10
const RATE_LIMIT_PER_HOUR = 60

function buildSystemPrompt(schema: DatasetSchema, chartLibrary: ChartLibrary, chartCode?: string, vegaSpec?: string, explanation?: string, allSchemas?: AllSchemaEntry[]): string {
  const cols = schema.columns.map(c => `${c.name} (${c.type})`).join(', ')

  let prompt = `You are the senior data analyst who built and analyzed this ${chartLibrary === 'd3' ? 'D3.js' : 'Vega-Lite'} chart. The user is your stakeholder reviewing the chart you created.

Dataset: ${schema.rowCount} rows with columns: ${cols}

`

  if (chartCode) {
    prompt += `Chart code you wrote:\n${chartCode}\n\n`
  } else if (vegaSpec) {
    prompt += `Vega-Lite spec you wrote:\n${vegaSpec}\n\n`
  }

  if (explanation) {
    try {
      const parsed = JSON.parse(explanation)
      if (parsed.chartInsights || parsed.dataInsights) {
        prompt += `Your analysis notes on this chart:\n`
        if (parsed.chartInsights?.length) {
          prompt += `  Chart insights: ${parsed.chartInsights.join('; ')}\n`
        }
        if (parsed.dataInsights?.length) {
          prompt += `  Data insights: ${parsed.dataInsights.join('; ')}\n`
        }
        prompt += `\n`
      }
    } catch {
      prompt += `Your analysis notes: ${explanation}\n\n`
    }
  }

  if (allSchemas && allSchemas.length > 1) {
    const others = allSchemas.filter(s => s.schema !== schema)
    if (others.length > 0) {
      prompt += `Other datasets available in this project:\n`
      for (const s of others) {
        const sCols = s.schema.columns.map(c => `${c.name} (${c.type})`).join(', ')
        prompt += `- "${s.fileName}" (datasetId: ${s.datasetId}): ${s.schema.rowCount} rows with columns: ${sCols}\n`
      }
      prompt += `\n`
    }
  }

  prompt += `When the user asks you to explain an insight, expand authoritatively on YOUR prior analysis — you wrote it, so own it. Reference specific columns, values, and patterns from the data. Be concise — use short paragraphs and bullet lists.`

  return prompt
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth check
    const { user } = await getAuthenticatedUser(req)

    const { message, schema, chartLibrary, chartCode, vegaSpec, explanation, conversationHistory, allSchemas } = await req.json() as AnalystChatRequest

    if (!message || !schema) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: message and schema' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limit check
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const { allowed } = await checkRateLimit(supabaseUrl, serviceRoleKey, user.id, 'analyst_chat', RATE_LIMIT_PER_HOUR)
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait before sending more messages.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
      )
    }

    // Credit check
    await useCredits(user.id, 'analyst-chat')

    const systemPrompt = buildSystemPrompt(schema, chartLibrary, chartCode, vegaSpec, explanation, allSchemas)

    // Truncate conversation history to last N messages to control token usage
    const truncatedHistory = conversationHistory.slice(-MAX_HISTORY_MESSAGES)

    const messages: ChatMessage[] = [
      ...truncatedHistory.map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: message },
    ]

    const reply = await analystChatWithRetry(systemPrompt, messages)

    // Log usage
    await logUsageEvent(supabaseUrl, serviceRoleKey, user.id, 'analyst_chat')

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    if (error instanceof AuthError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: error.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (error instanceof InsufficientCreditsError) {
      return new Response(
        JSON.stringify({ error: error.message, creditsRemaining: error.remaining }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.error('Error in analyst chat:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
