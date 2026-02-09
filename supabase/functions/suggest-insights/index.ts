import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { suggestInsightsWithRetry, DatasetSchema, AllSchemaEntry } from '../_shared/llm-adapter.ts'

interface SuggestInsightsRequest {
  schema: DatasetSchema
  allSchemas?: AllSchemaEntry[]
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { schema, allSchemas } = await req.json() as SuggestInsightsRequest

    if (!schema || !schema.columns) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: schema' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const suggestions = await suggestInsightsWithRetry(schema, allSchemas)

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error suggesting insights:', error)

    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
