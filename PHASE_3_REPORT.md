# Next.js 16 Migration — Phase 3 (AI Gateway) Report + Setup

**Branch:** `migrate/next16`
**As of:** 2026-07-12
**Scope chosen:** move LLM compute to Vercel (Route Handlers + AI Gateway). Sandbox deferred.

## What moved

The three LLM edge functions + the coupled `refund-credit` are now Next Route Handlers on Vercel, calling models through **Vercel AI Gateway** via the `ai` SDK v6. Stripe + `get-credits` stay on Supabase.

| Was (Supabase/Deno) | Now (Next/Vercel) | Credit |
|---|---|---|
| `generate-chart` | `app/api/generate-chart/route.ts` | 1 |
| `analyst-chat` | `app/api/analyst-chat/route.ts` | 1 |
| `suggest-insights` | `app/api/suggest-insights/route.ts` | free |
| `refund-credit` | `app/api/refund-credit/route.ts` | +1 |
| `get-credits`, `create-checkout-session`, `stripe-webhook` | **unchanged on Supabase** | — |

### New code
- `src/lib/llm/` — `prompts.ts` (SYSTEM_PROMPT_D3/VEGA/INSIGHTS + builders, ported verbatim), `analyst.ts` (analyst system prompt), `types.ts`, `client.ts` (`generateChart`/`suggestInsights` via `generateObject` `output:'no-schema'`; `analystChat` via `generateText`; `provider/model` slugs, per-feature gateway tags + `user`, 45s timeout, `maxRetries: 2`).
- `src/lib/server/` — `auth.ts` (cookie-session `requireUser`), `credits.ts` (`checkCredits`/`deductCredits`/`getCredits`), `usage.ts` (rate limit + `logUsageEvent`), `supabase-admin.ts` (service-role client), `respond.ts` (error → JSON).
- Client rewired: `chartStore`, `AnalystNotes`, `InsightSuggestions`, `ProjectClient` now `fetch('/api/…')` (same-origin, cookie auth) instead of `supabase.functions.invoke`.

### Commits: `910b108` (3a) · `c32eb36` (3b) · `2d588b9` (3c) · `6718528` (3d).

## Key decisions
- **Auth:** routes authenticate via the cookie session (`createSupabaseServerClient().auth.getUser()`), not Bearer tokens — same-origin `fetch` carries the `@supabase/ssr` cookies.
- **Privileged ops** (rate limit, credit deduct/refund, usage log) use a **service-role** admin client → requires `SUPABASE_SERVICE_ROLE_KEY` on Vercel (server-only; never shipped to client).
- **Structured output:** `generateObject` with `output: 'no-schema'` = unconstrained JSON, matching the original edge behavior 1:1 (safe for arbitrary Vega specs). Mapping mirrors the old `parseChartResponse`/`parseInsightsResponse`.
- **No `runtime` segment export** — `cacheComponents` rejects it; Node is the route-handler default. `maxDuration` set per route.
- **Models** match the original prompt2chart config: `LLM_MODEL` default `openai/gpt-4o`, `LLM_CHAT_MODEL` default `openai/gpt-4o-mini` (the original ran `LLM_PROVIDER=openai` with those models; now routed through the gateway for a faithful cutover). Env-overridable to try other providers (e.g. `anthropic/claude-sonnet-5`). All three verified reachable through the gateway via OIDC.

## Required setup (do this before the routes work at runtime)

1. **Enable AI Gateway** (dashboard only): Vercel → project `prompt2chart-next16` → Settings → AI Gateway → enable. Every team gets free monthly credits.

2. **Add the Supabase service-role key to Vercel** (from Supabase → Project Settings → API → `service_role` secret):
   ```bash
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   # paste the key; select Production + Preview + Development
   ```

3. **(Optional) pin models:**
   ```bash
   vercel env add LLM_MODEL          # e.g. anthropic/claude-sonnet-5
   vercel env add LLM_CHAT_MODEL     # e.g. anthropic/claude-haiku-4.5
   ```

4. **Pull env locally** (refreshes `VERCEL_OIDC_TOKEN` for AI Gateway OIDC auth + fetches the new vars):
   ```bash
   vercel env pull .env.local
   ```
   The OIDC token is ~24h; re-run `vercel env pull .env.local` when it expires. Alternatively, for a static local key, create an AI Gateway key in the dashboard and set `AI_GATEWAY_API_KEY` in `.env.local`.

5. **Test:**
   - Local: `npm run dev`, sign in, upload a dataset, generate a chart, open Analyst notes, check suggestions. Confirm credits decrement and a render failure refunds.
   - Or preview deploy: `vercel deploy` (env + OIDC auto-provisioned) and test there.

> Note: the old `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `LLM_PROVIDER` Supabase secrets are no longer used by the app's LLM path (the gateway handles provider auth). They remain in use only by the still-deployed Supabase functions until those are removed (below).

## Deferred to Phase 4 (verified cutover)
- **Delete the four migrated Supabase functions** (`generate-chart`, `analyst-chat`, `suggest-insights`, `refund-credit`) + `supabase functions delete` them. Kept as a live fallback until a preview deploy confirms the Next routes work. The client no longer calls them.
- **Full `CLAUDE.md` rewrite** — it still describes the Vite/edge-function architecture (stale for the whole migration, not just Phase 3). Do the comprehensive update at cutover.
- **Streaming** for analyst-chat / generation is a future enhancement (kept non-streaming to preserve the current client contract).

## Verification status
Per-step `tsc --noEmit`, `next build` (all 4 `ƒ /api/*` routes registered, PPR routes intact), and lint on changed files are green. **Runtime e2e is unverified** — it needs the env/gateway setup above; test on `npm run dev` or a preview deploy.
