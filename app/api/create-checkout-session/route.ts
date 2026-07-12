import Stripe from 'stripe'
import { requireUser } from '@/lib/server/auth'
import { CREDIT_PACKS } from '@/lib/server/credits'
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin'
import { handleRouteError } from '@/lib/server/respond'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const user = await requireUser()

    const { packId } = (await req.json()) as { packId?: string }
    const pack = CREDIT_PACKS.find((p) => p.id === packId)
    if (!pack) {
      return Response.json({ error: 'Invalid credit pack' }, { status: 400 })
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return Response.json({ error: 'Stripe is not configured' }, { status: 503 })
    }
    const stripe = new Stripe(stripeKey)

    const admin = createSupabaseAdminClient()

    // Get or create the Stripe customer for this user
    const { data: credits } = await admin
      .from('user_credits')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let customerId = credits?.stripe_customer_id as string | undefined

    // Verify the stored customer still exists in the ACTIVE Stripe mode. A
    // customer created in live mode (e.g. from a past purchase) does not exist
    // under a sandbox/test key — and vice versa — which throws "No such
    // customer". Also handles deleted customers. Recreate when missing.
    if (customerId) {
      try {
        const existing = await stripe.customers.retrieve(customerId)
        if ('deleted' in existing && existing.deleted) customerId = undefined
      } catch {
        customerId = undefined
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await admin
        .from('user_credits')
        .upsert({ user_id: user.id, stripe_customer_id: customerId }, { onConflict: 'user_id' })
    }

    // Same-origin: redirect back to whichever origin the request came from
    const origin = req.headers.get('origin') || new URL(req.url).origin

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${pack.name} — ${pack.credits} Credits`,
              description: `${pack.credits} chart generation credits for Prompt2Chart`,
            },
            unit_amount: pack.priceUsd,
          },
          quantity: 1,
        },
      ],
      metadata: {
        supabase_user_id: user.id,
        pack_id: pack.id,
        credits: String(pack.credits),
      },
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/dashboard?checkout=cancelled`,
    })

    return Response.json({ url: session.url })
  } catch (error) {
    return handleRouteError(error)
  }
}
