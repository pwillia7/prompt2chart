import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'
import { getAuthenticatedUser, AuthError } from '../_shared/auth.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user } = await getAuthenticatedUser(req)
    const { chartId } = await req.json()

    if (!chartId) {
      return new Response(
        JSON.stringify({ error: 'Missing chartId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // Verify the chart belongs to this user via project ownership
    const { data: chart, error: chartError } = await adminClient
      .from('charts')
      .select('id, project_id')
      .eq('id', chartId)
      .single()

    if (chartError || !chart) {
      return new Response(
        JSON.stringify({ error: 'Chart not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: project, error: projectError } = await adminClient
      .from('projects')
      .select('id')
      .eq('id', chart.project_id)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Refund 1 credit
    const { data: current, error: fetchError } = await adminClient
      .from('user_credits')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    if (fetchError || !current) {
      return new Response(
        JSON.stringify({ error: 'Could not fetch credit balance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const newBalance = current.balance + 1
    const { error: updateError } = await adminClient
      .from('user_credits')
      .update({ balance: newBalance })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Credit refund failed:', updateError)
      return new Response(
        JSON.stringify({ error: 'Refund failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Refunded 1 credit to user ${user.id} for chart ${chartId} (render failure). New balance: ${newBalance}`)

    return new Response(
      JSON.stringify({ balance: newBalance, refunded: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    if (error instanceof AuthError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: error.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.error('Error refunding credit:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
