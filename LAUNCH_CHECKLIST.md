# Prompt2Chart — Production Launch Checklist

Domain: **prompt2chart.com**

---

## 1. Supabase Production Project

- [ ] Create production project at [supabase.com](https://supabase.com)
- [ ] Note your project ref, URL, anon key, and service role key
- [ ] Link local project:
  ```bash
  supabase link --project-ref <your-project-ref>
  ```
- [ ] Push all database migrations:
  ```bash
  supabase db push
  ```
  This applies all 7 migrations (schema, storage, D3 support, dataset IDs, parent chart IDs, credits, credit updates).
- [ ] Verify tables exist: `projects`, `datasets`, `charts`, `usage_events`, `user_credits`, `credit_transactions`
- [ ] Verify functions exist: `deduct_credits`, `add_credits`, `grant_monthly_credits`, `handle_new_user_credits`

## 2. Supabase Auth

- [ ] Go to **Authentication > URL Configuration** in Supabase dashboard
- [ ] Set **Site URL** to `https://prompt2chart.com`
- [ ] Add **Redirect URLs**:
  - `https://prompt2chart.com`
  - `https://prompt2chart.com/`
  - `https://prompt2chart.com/login`
  - `https://prompt2chart.com/dashboard`
- [ ] Enable desired auth providers under **Authentication > Providers**:
  - Email/Password (already works)
  - Google OAuth (optional — add client ID/secret)
  - GitHub OAuth (optional — add client ID/secret)
- [ ] Customize email templates (optional) under **Authentication > Email Templates**:
  - Confirmation email
  - Password reset email
  - Magic link email

## 3. Supabase Edge Functions

- [ ] Set all secrets:
  ```bash
  supabase secrets set LLM_PROVIDER=openai
  supabase secrets set OPENAI_API_KEY=sk-proj-...
  supabase secrets set STRIPE_SECRET_KEY=sk_live_...
  supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
  supabase secrets set ALLOWED_ORIGIN=https://prompt2chart.com
  ```
  Optional model overrides:
  ```bash
  supabase secrets set OPENAI_MODEL=gpt-4o
  supabase secrets set OPENAI_CHAT_MODEL=gpt-4o-mini
  ```
- [ ] Deploy all edge functions:
  ```bash
  supabase functions deploy generate-chart
  supabase functions deploy analyst-chat
  supabase functions deploy suggest-insights
  supabase functions deploy create-checkout-session
  supabase functions deploy stripe-webhook --no-verify-jwt
  supabase functions deploy get-credits
  ```
  **Note:** `stripe-webhook` must use `--no-verify-jwt` since Stripe sends requests without a Supabase JWT.
- [ ] Test each function responds (check logs in Supabase dashboard)

## 4. Stripe Production Setup

- [ ] Switch Stripe dashboard to **live mode**
- [ ] Get **live secret key** (`sk_live_...`) and set as `STRIPE_SECRET_KEY` in Supabase secrets
- [ ] Create webhook endpoint in Stripe dashboard:
  - **URL:** `https://<your-supabase-project>.supabase.co/functions/v1/stripe-webhook`
  - **Events:** `checkout.session.completed`
- [ ] Copy the webhook **signing secret** (`whsec_...`) and set as `STRIPE_WEBHOOK_SECRET` in Supabase secrets
- [ ] Send a test webhook event from Stripe dashboard to verify it works
- [ ] Verify credit packs display correctly: 100/$5, 300/$15, 800/$30

## 5. Frontend Build & Deploy

- [ ] Create production `.env.local`:
  ```
  VITE_SUPABASE_URL=https://<your-project>.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGc...
  ```
- [ ] Build:
  ```bash
  npm run build
  ```
- [ ] Deploy `dist/` folder to hosting provider (Vercel, Netlify, Cloudflare Pages, etc.)
- [ ] Configure custom domain `prompt2chart.com` on your hosting provider
- [ ] Set up SSL (automatic on Vercel/Netlify/Cloudflare)

## 6. DNS Configuration

- [ ] Point `prompt2chart.com` to your hosting provider:
  - **Vercel:** Add CNAME record pointing to `cname.vercel-dns.com`
  - **Netlify:** Add CNAME record pointing to your Netlify site
  - **Cloudflare Pages:** Add CNAME record per their docs
- [ ] Set up `www.prompt2chart.com` redirect to `prompt2chart.com` (or vice versa)
- [ ] Verify SSL certificate is active (may take a few minutes)

## 7. Verify Core Flows

- [ ] **Landing page** loads at `https://prompt2chart.com`
- [ ] **Signup** creates account and grants 100 credits
- [ ] **Login** works with email/password
- [ ] **Password reset** sends email with correct link back to prompt2chart.com
- [ ] **Dataset upload** works (CSV/JSON)
- [ ] **Chart generation** works for both D3 and Vega-Lite
- [ ] **Chart export** works (PNG, SVG, HTML, CodePen, Copy Code)
- [ ] **Analyst chat** works and deducts 1 credit
- [ ] **Insight suggestions** load (free, no credit cost)
- [ ] **Credit purchase** redirects to Stripe, payment succeeds, credits added
- [ ] **Credit display** updates correctly after generation and purchase
- [ ] **Feedback form** sends email to prompt2chart@gmail.com
- [ ] **Dark/light mode** toggle works and persists
- [ ] **Umami analytics** receiving page views at cloud.umami.is

## 8. Security Checklist

- [ ] `ALLOWED_ORIGIN` is set to `https://prompt2chart.com` (not `*`)
- [ ] Supabase RLS is enabled on all tables (verify in dashboard under Table Editor)
- [ ] Service role key is ONLY used in edge functions, never exposed to frontend
- [ ] Stripe webhook uses signature verification (`constructEventAsync`)
- [ ] No API keys in frontend code (only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`)
- [ ] Rate limits are active on all LLM-calling edge functions (30/hr charts, 60/hr chat, 10/hr suggestions)

## 9. Post-Launch Monitoring

- [ ] Monitor **Supabase Edge Function logs** for errors
- [ ] Monitor **Stripe webhook events** for failures (Stripe dashboard > Webhooks > Attempts)
- [ ] Check **Umami analytics** dashboard for traffic and event tracking
- [ ] Watch `credit_transactions` table for any anomalies
- [ ] Set up Supabase **database backups** (automatic on paid plans)
- [ ] Monitor LLM API usage/costs in OpenAI/Anthropic dashboard

## 10. Optional Enhancements

- [ ] Add `robots.txt` and `sitemap.xml` for SEO
- [ ] Add Open Graph meta tags for social sharing
- [ ] Set up a custom email domain for transactional emails (Supabase SMTP settings)
- [ ] Configure Supabase storage policies if using file uploads beyond datasets
- [ ] Set up error alerting (e.g., Sentry, LogSnag, or email alerts on function failures)

---

## Quick Reference: All Supabase Secrets

| Secret | Value | Notes |
|--------|-------|-------|
| `LLM_PROVIDER` | `openai` or `anthropic` | Which LLM to use |
| `OPENAI_API_KEY` | `sk-proj-...` | Required if provider is openai |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Required if provider is anthropic |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Live mode key |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | From webhook endpoint config |
| `ALLOWED_ORIGIN` | `https://prompt2chart.com` | CORS + Stripe redirects |
| `OPENAI_MODEL` | `gpt-4o` | Optional: chart generation model |
| `OPENAI_CHAT_MODEL` | `gpt-4o-mini` | Optional: analyst chat model |

## Quick Reference: Edge Functions

| Function | JWT Required | Credits | Rate Limit |
|----------|-------------|---------|------------|
| `generate-chart` | Yes | 1 credit | 30/hr |
| `analyst-chat` | Yes | 1 credit | 60/hr |
| `suggest-insights` | Yes | Free | 10/hr |
| `create-checkout-session` | Yes | — | — |
| `stripe-webhook` | **No** (use `--no-verify-jwt`) | — | — |
| `get-credits` | Yes | — | — |
