import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { getAuthenticatedUser, AuthError } from '../_shared/auth.ts'
import { getCredits, CREDIT_PACKS } from '../_shared/credits.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user } = await getAuthenticatedUser(req)

    const balance = await getCredits(user.id)

    return new Response(
      JSON.stringify({ balance, packs: CREDIT_PACKS }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    if (error instanceof AuthError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: error.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.error('Error getting credits:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
