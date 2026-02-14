# Prompt2Chart — Pricing & Credits

## How Credits Work

Credits are the usage currency for Prompt2Chart. Each account starts with **100 free credits** on signup. Credits are consumed when AI-powered features are used.

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
| Starter | 100 | $5 | $0.05 |
| Pro | 300 | $15 | $0.05 |
| Power | 800 | $30 | $0.0375 |

Credits never expire and are non-refundable. Purchased via Stripe Checkout (one-time payments, no subscription).

## Monthly Free Credits

After the first month, eligible users receive **20 free credits per month**. Credits are granted automatically on your next visit.

**Eligibility:**
- Your account must be at least 30 days old
- You must have fewer than 100 credits remaining, **or** have purchased credits at least once

This ensures active users always have some credits to work with, while the generous 100-credit signup bonus covers the first month.

## Rate Limits

In addition to credits, hourly rate limits apply to prevent abuse:

| Action | Limit |
|--------|-------|
| Chart generation | 30 / hour |
| Visualization suggestions | 10 / hour |
| Analyst chat messages | 60 / hour |

## Free Tier

Every new account receives **100 free credits** — enough for 100 chart generations or analyst chat messages (or any mix). No credit card required to sign up. After the first month, eligible users receive 20 free credits monthly.

## Technical Details

- Credits are stored in the `user_credits` table with atomic row-level locking to prevent race conditions
- All transactions are logged in `credit_transactions` for a full audit trail
- Payments are processed via Stripe Checkout with webhook fulfillment
- The `checkout.session.completed` webhook event triggers credit addition
- Monthly credits are granted lazily when the user fetches their balance
