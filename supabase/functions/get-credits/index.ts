import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'
import { getAuthenticatedUser, AuthError } from '../_shared/auth.ts'
import { getCredits, CREDIT_PACKS } from '../_shared/credits.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user } = await getAuthenticatedUser(req)

    // Lazily grant monthly free credits if eligible
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const adminClient = createClient(supabaseUrl, serviceRoleKey)
      await adminClient.rpc('grant_monthly_credits', { p_user_id: user.id })
    } catch (e) {
      console.error('Monthly credit grant failed (non-blocking):', e)
    }

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
