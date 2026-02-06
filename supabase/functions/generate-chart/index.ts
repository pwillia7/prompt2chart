import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { generateChartWithRetry, DatasetSchema, ChartLibrary } from '../_shared/llm-adapter.ts'

interface GenerateChartRequest {
  prompt: string
  schema: DatasetSchema
  library?: ChartLibrary
  existingCode?: string | null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, schema, library, existingCode } = await req.json() as GenerateChartRequest

    if (!prompt || !schema) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: prompt and schema' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = await generateChartWithRetry(
      prompt,
      schema,
      library || 'vega-lite',
      existingCode || undefined,
    )

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error generating chart:', error)

    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
