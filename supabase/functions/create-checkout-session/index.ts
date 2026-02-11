import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'
import { getAuthenticatedUser, AuthError } from '../_shared/auth.ts'
import { CREDIT_PACKS } from '../_shared/credits.ts'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'

interface CheckoutRequest {
  packId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user } = await getAuthenticatedUser(req)

    const { packId } = await req.json() as CheckoutRequest

    const pack = CREDIT_PACKS.find(p => p.id === packId)
    if (!pack) {
      return new Response(
        JSON.stringify({ error: 'Invalid credit pack' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe is not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    })

    // Get or create Stripe customer
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: credits } = await adminClient
      .from('user_credits')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let customerId = credits?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      // Ensure user_credits row exists and store Stripe customer ID
      await adminClient
        .from('user_credits')
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
        }, { onConflict: 'user_id' })
    }

    // Determine redirect origin
    const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN')
    const origin = (allowedOrigin && allowedOrigin !== '*') ? allowedOrigin : 'http://localhost:5173'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${pack.name} — ${pack.credits} Credits`,
            description: `${pack.credits} chart generation credits for Prompt2Chart`,
          },
          unit_amount: pack.priceUsd,
        },
        quantity: 1,
      }],
      metadata: {
        supabase_user_id: user.id,
        pack_id: pack.id,
        credits: String(pack.credits),
      },
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/dashboard?checkout=cancelled`,
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    if (error instanceof AuthError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: error.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
