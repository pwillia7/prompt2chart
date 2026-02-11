import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { getAuthenticatedUser, AuthError, checkRateLimit, logUsageEvent } from '../_shared/auth.ts'
import { useCredits, InsufficientCreditsError } from '../_shared/credits.ts'
import { suggestInsightsWithRetry, DatasetSchema, AllSchemaEntry } from '../_shared/llm-adapter.ts'

interface SuggestInsightsRequest {
  schema: DatasetSchema
  allSchemas?: AllSchemaEntry[]
}

const RATE_LIMIT_PER_HOUR = 10

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth check
    const { user } = await getAuthenticatedUser(req)

    const { schema, allSchemas } = await req.json() as SuggestInsightsRequest

    if (!schema || !schema.columns) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: schema' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limit check
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const { allowed } = await checkRateLimit(supabaseUrl, serviceRoleKey, user.id, 'suggest_insights', RATE_LIMIT_PER_HOUR)
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait before requesting more suggestions.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '300' } }
      )
    }

    // Credit check
    await useCredits(user.id, 'suggest-insights')

    const suggestions = await suggestInsightsWithRetry(schema, allSchemas)

    // Log usage
    await logUsageEvent(supabaseUrl, serviceRoleKey, user.id, 'suggest_insights')

    return new Response(
      JSON.stringify({ suggestions }),
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

    console.error('Error suggesting insights:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
