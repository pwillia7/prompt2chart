import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'

serve(async (req) => {
  // Webhook only accepts POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!stripeKey || !webhookSecret) {
    return new Response('Stripe not configured', { status: 503 })
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2023-10-16',
  })

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  let event: Stripe.Event
  try {
    // Must use async version in Deno (SubtleCrypto is async-only)
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const userId = session.metadata?.supabase_user_id
    const credits = parseInt(session.metadata?.credits || '0', 10)
    const packId = session.metadata?.pack_id

    if (!userId || !credits) {
      console.error('Missing metadata in checkout session:', session.id)
      return new Response('Missing metadata', { status: 400 })
    }

    // Add credits via the database function
    const { error } = await adminClient.rpc('add_credits', {
      p_user_id: userId,
      p_amount: credits,
      p_reason: 'purchase',
      p_metadata: {
        stripe_session_id: session.id,
        pack_id: packId,
        amount_total: session.amount_total,
      },
    })

    if (error) {
      console.error('Failed to add credits:', error)
      return new Response('Failed to add credits', { status: 500 })
    }

    // Mark user as a paid customer
    await adminClient
      .from('user_credits')
      .update({ ever_purchased: true })
      .eq('user_id', userId)

    console.log(`Added ${credits} credits to user ${userId} (session: ${session.id})`)
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
