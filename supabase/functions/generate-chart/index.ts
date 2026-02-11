import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { getAuthenticatedUser, AuthError, checkRateLimit, logUsageEvent } from '../_shared/auth.ts'
import { generateChartWithRetry, DatasetSchema, ChartLibrary, AllSchemaEntry } from '../_shared/llm-adapter.ts'

interface GenerateChartRequest {
  prompt: string
  schema: DatasetSchema
  library?: ChartLibrary
  existingCode?: string | null
  allSchemas?: AllSchemaEntry[]
}

const MAX_PROMPT_LENGTH = 4000
const MAX_BODY_SIZE = 100_000 // 100KB
const RATE_LIMIT_PER_HOUR = 30

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth check
    const { user } = await getAuthenticatedUser(req)

    // Body size check
    const body = await req.text()
    if (body.length > MAX_BODY_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Request body too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { prompt, schema, library, existingCode, allSchemas } = JSON.parse(body) as GenerateChartRequest

    if (!prompt || !schema) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: prompt and schema' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limit check
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const { allowed, remaining } = await checkRateLimit(supabaseUrl, serviceRoleKey, user.id, 'chart_generation', RATE_LIMIT_PER_HOUR)
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait before generating more charts.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '300' } }
      )
    }

    const response = await generateChartWithRetry(
      prompt,
      schema,
      library || 'vega-lite',
      existingCode || undefined,
      allSchemas,
    )

    // Log usage
    await logUsageEvent(supabaseUrl, serviceRoleKey, user.id, 'chart_generation', {
      library: library || 'vega-lite',
      hasExistingCode: !!existingCode,
      remaining: remaining - 1,
    })

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    if (error instanceof AuthError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: error.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.error('Error generating chart:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
