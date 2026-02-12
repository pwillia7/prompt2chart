# Prompt2Chart — Pricing & Credits

## How Credits Work

Credits are the usage currency for Prompt2Chart. Each account starts with **20 free credits** on signup. Credits are consumed when AI-powered features are used.

## Credit Costs

| Action | Cost |
|--------|------|
| Chart generation (D3 or Vega-Lite) | 1 credit |
| Analyst chat message | 1 credit |
| Visualization suggestions | Free |
| Exporting charts (PNG, SVG, HTML, CodePen) | Free |
| Browsing / viewing existing charts | Free |

Credits are only deducted after a **successful** AI response. If the LLM call fails (timeout, API error), no credit is charged.

## Credit Packs

| Pack | Credits | Price | Per-Credit Cost |
|------|---------|-------|-----------------|
| Starter | 50 | $5 | $0.10 |
| Pro | 200 | $15 | $0.075 |
| Power | 500 | $30 | $0.06 |

Credits never expire and are non-refundable. Purchased via Stripe Checkout (one-time payments, no subscription).

## Rate Limits

In addition to credits, hourly rate limits apply to prevent abuse:

| Action | Limit |
|--------|-------|
| Chart generation | 30 / hour |
| Visualization suggestions | 10 / hour |
| Analyst chat messages | 60 / hour |

## Free Tier

Every new account receives **20 free credits** — enough for 20 chart generations or analyst chat messages (or any mix). No credit card required to sign up.

## Technical Details

- Credits are stored in the `user_credits` table with atomic row-level locking to prevent race conditions
- All transactions are logged in `credit_transactions` for a full audit trail
- Payments are processed via Stripe Checkout with webhook fulfillment
- The `checkout.session.completed` webhook event triggers credit addition
