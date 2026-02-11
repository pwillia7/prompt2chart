import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
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
      // not JSON, include as-is
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
    const { message, schema, chartLibrary, chartCode, vegaSpec, explanation, conversationHistory, allSchemas } = await req.json() as AnalystChatRequest

    if (!message || !schema) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: message and schema' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const systemPrompt = buildSystemPrompt(schema, chartLibrary, chartCode, vegaSpec, explanation, allSchemas)

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
