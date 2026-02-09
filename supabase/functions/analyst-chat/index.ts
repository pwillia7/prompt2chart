import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { analystChatWithRetry, ChatMessage, DatasetSchema, ChartLibrary } from '../_shared/llm-adapter.ts'

interface AnalystChatRequest {
  message: string
  schema: DatasetSchema
  chartLibrary: ChartLibrary
  chartCode?: string
  vegaSpec?: string
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
}

function buildSystemPrompt(schema: DatasetSchema, chartLibrary: ChartLibrary, chartCode?: string, vegaSpec?: string): string {
  const cols = schema.columns.map(c => `${c.name} (${c.type})`).join(', ')

  let prompt = `You are a senior data analyst. The user is looking at a ${chartLibrary === 'd3' ? 'D3.js' : 'Vega-Lite'} chart built from their dataset.

Dataset: ${schema.rowCount} rows with columns: ${cols}

`

  if (chartCode) {
    prompt += `Current chart code:\n${chartCode}\n\n`
  } else if (vegaSpec) {
    prompt += `Current Vega-Lite spec:\n${vegaSpec}\n\n`
  }

  prompt += `Answer questions about patterns, suggest improvements, explain statistical concepts. Be concise — use short paragraphs and bullet lists. Reference actual column names.`

  return prompt
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, schema, chartLibrary, chartCode, vegaSpec, conversationHistory } = await req.json() as AnalystChatRequest

    if (!message || !schema) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: message and schema' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const systemPrompt = buildSystemPrompt(schema, chartLibrary, chartCode, vegaSpec)

    const messages: ChatMessage[] = [
      ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: message },
    ]

    const reply = await analystChatWithRetry(systemPrompt, messages)

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in analyst chat:', error)

    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
