# CLAUDE.md - prompt2chart

## What This Project Is

A web app that generates interactive data visualizations from natural language prompts. Users upload CSV/JSON datasets, type what they want to see, and an LLM generates D3.js or Vega-Lite chart code.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript, deployed on **Vercel**
- **Styling:** TailwindCSS
- **Backend data:** Supabase (Auth, PostgreSQL, Storage) — same project as before the migration; all users/data preserved
- **Server logic:** Next.js Route Handlers (`app/api/*`) on Vercel Fluid Compute
- **Charts:** D3.js v7 (code generation), Vega-Lite v5 (spec generation)
- **State:** Zustand stores (no Redux, no Context)
- **LLM:** Vercel **AI Gateway** via the `ai` SDK v6 (default `openai/gpt-4o` + `openai/gpt-4o-mini`)
- **Payments:** Stripe (checkout via a Next route; webhook stays on Supabase)

> This app was migrated from Vite/React (Netlify) to Next.js 16/Vercel. See `PHASE_2_REPORT.md` and `PHASE_3_REPORT.md` for the migration record. `main` becomes the Vercel production branch at the final cutover.

## Commands

```bash
npm run dev        # next dev (http://localhost:3000)
npm run build      # next build (Turbopack; runs its own typecheck)
npm run lint       # ESLint
npm run start      # next start (serve the production build)
npx tsc --noEmit   # Type check only
```

For local dev against real Supabase + AI Gateway, run `vercel env pull .env.local --yes` (provides Supabase keys, `SUPABASE_SERVICE_ROLE_KEY`, and a ~24h `VERCEL_OIDC_TOKEN` for the gateway).

## Project Structure

```
app/                         # Next.js App Router
  layout.tsx                 # root layout, next/font, Umami <Script>, metadata
  page.tsx                   # marketing home
  (routes)/                  # dashboard, projects/[projectId], share/[shareId],
                             #   pricing, login, signup, blog, ...  (page.tsx + *Client.tsx)
  api/                       # Route Handlers (server):
    generate-chart/          #   LLM chart generation  (1 credit)
    analyst-chat/            #   Q&A about a chart      (1 credit)
    suggest-insights/        #   viz suggestions        (free)
    refund-credit/           #   refund on render failure
    get-credits/             #   balance + credit packs + monthly grant
    create-checkout-session/ #   Stripe checkout
src/
  components/                # auth/, charts/, datasets/, layout/, projects/, billing/, ui/
  lib/
    llm/                     # AI Gateway client + ported system prompts
                             #   client.ts, prompts.ts, analyst.ts, types.ts
    server/                  # server-only: auth (cookie session), credits, usage,
                             #   supabase-admin (service role), respond
    cacheActions.ts          # 'use server' updateTag helpers
    supabase.ts              # browser client (createBrowserClient)
    supabase-server.ts       # server client (cookie-scoped, per request)
    supabase-middleware.ts   # session refresh helper (used by proxy.ts)
    ...                      # schemaGenerator, chartExporter, dataSampler, analytics, ...
  store/                     # Zustand: authStore, projectStore, chartStore, datasetStore, billingStore
  types/                     # All TypeScript interfaces (index.ts)
proxy.ts                     # Next 16 middleware (session refresh)
supabase/
  functions/
    stripe-webhook/          # ACTIVE — Stripe calls it directly (grants credits)
    _shared/, generate-chart/, analyst-chat/, suggest-insights/,
    refund-credit/, get-credits/, create-checkout-session/
                             # DEPRECATED — migrated to app/api/*; deleted at cutover
  migrations/                # SQL schema + RLS
```

## Architecture: How Chart Generation Works

1. User types a prompt in `app/projects/[projectId]/ProjectClient.tsx`
2. `chartStore.generateChart()` does `fetch('/api/generate-chart')` (same-origin, cookie auth)
3. The Route Handler validates auth/rate-limit/credits, then calls `src/lib/llm/client.ts`, which uses `generateObject`/`generateText` (`ai` SDK) routed through **AI Gateway**
4. LLM returns D3 code (string) or a Vega-Lite spec (JSON)
5. Frontend renders with `D3ChartRenderer` or `ChartRenderer`

### D3 Sandbox

Generated D3 code runs inside a `new Function()` constructor with injected variables:
- `d3` - the d3 library
- `svg` - a d3 selection of a pre-created 700x450 SVG
- `container` - a d3 selection of the parent div (for HTML legends, tooltips, multi-chart)
- `data` - structuredClone of the dataset (prevents mutation)
- `width` (700), `height` (450), `margin` ({ top: 40, right: 40, bottom: 60, left: 60 })

Code MUST use the provided `svg` — it cannot create new SVGs or access the DOM directly.

### Vega-Lite

Specs are rendered via `vega-embed`. Data can be embedded in the spec or passed separately. Specs are validated client-side before rendering.

## Key Patterns

### Legends
Always HTML elements appended to `container` div, never SVG (SVG legends overflow the viewBox). The renderer auto-propagates SVG background color to the container div so legends match the chart theme. Dark backgrounds get light text color automatically.

### Interactivity (D3)
- **Zoom+Pan:** Semantic zoom with `rescaleX/Y`, wheel zooms, drag pans
- **Brushing:** `d3.brush()` on drag, dims unselected to 0.15 opacity
- **Combined:** Mode toggle toolbar (Pan/Select buttons), brush uses zoom-aware scales
- **Clip paths:** On `chartArea` sub-group only, so axes stay visible during zoom
- **Multi-chart:** Additional SVGs appended to `container`, not inside main SVG
- **Tooltips:** Must be declared before event handlers that reference them

### Cache Components (Next 16 PPR)
`cacheComponents: true` is enabled. Data routes are Partial Prerender: a static shell plus dynamic/streamed parts.
- Per-user server fetches use `'use cache: private'` + `cacheTag` + `cacheLife('minutes')`; read `cookies()` in the page and pass `userId` as an argument.
- `'use cache: private'` is browser-memory only and re-runs every server render (never persists stale across reloads); the staleness window is soft client-side navigation.
- Mutations call thin `'use server'` `updateTag` actions (`src/lib/cacheActions.ts`) for read-your-own-writes.
- Client stores are seeded once per mount from server props via a `useState(() => ...)` initializer (NOT a ref).

### Suggestion Caching
`InsightSuggestions` checks `datasetStore.suggestionCache` (Map keyed by dataset UUID) before fetching. Cache persists across tab switches and navigation within the same session. Only cleared on page refresh or dataset deletion.

### State Management
- Zustand stores are the single source of truth — no prop drilling for global state
- Stores handle their own loading/error states
- Async effects use `cancelled` flags to prevent state updates after unmount
- React Strict Mode compatibility: side effects must tolerate double-invocation

### Chart Editing
Charts support parent-child relationships via `parent_chart_id`. When editing, existing code/spec is sent to the LLM with instructions to preserve features and only modify what was requested.

## The System Prompts

`src/lib/llm/prompts.ts` contains the system prompts that are critical to code quality (ported verbatim from the old Deno `llm-adapter.ts`):

- **SYSTEM_PROMPT_D3** (~490 lines): D3 code generation rules, interactivity patterns (zoom, brush, tooltips), legend patterns, multi-chart layout, style guidelines, and 10 Critical Rules
- **SYSTEM_PROMPT_VEGA**: Vega-Lite spec generation rules
- **SYSTEM_PROMPT_INSIGHTS**: suggestion generation
- `analyst.ts`: the analyst-chat system prompt

Changes to these prompts directly affect every chart generated. Keep them concise. **Never use markdown backticks inside these template-literal strings — they close the string and break the build.**

## Environment Variables

**Client (`NEXT_PUBLIC_*`, inlined at build):**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Server (Vercel project env — never shipped to client):**
- `SUPABASE_SERVICE_ROLE_KEY` — privileged ops (credits, rate limit, usage log)
- `STRIPE_SECRET_KEY` — checkout (sandbox `sk_test_` on preview/dev; live `sk_live_` on production)
- AI Gateway auth: `VERCEL_OIDC_TOKEN` (auto on Vercel / via `vercel env pull`) or a static `AI_GATEWAY_API_KEY`
- `LLM_MODEL` / `LLM_CHAT_MODEL` — optional; default `openai/gpt-4o` / `openai/gpt-4o-mini`

**Supabase secrets (for the `stripe-webhook` function):**
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (live), `STRIPE_WEBHOOK_SECRET_SANDBOX` (test), `SUPABASE_SERVICE_ROLE_KEY`

## Styling

All TailwindCSS, no custom CSS files. Custom `primary` color scale. Common patterns: cards `bg-[var(--surface-1)] rounded-card border border-[var(--border)] p-4`; button variants primary/secondary/ghost/danger.

## Export

Charts export to PNG, SVG, HTML, and raw code. PNG/SVG exports convert HTML legends to SVG elements (measuring positions from the live DOM) and expand the viewBox to fit. HTML export captures the full container natively.

## Analytics

Umami (`cloud.umami.is`, loaded via `next/script` in `app/layout.tsx`). Custom events go through `src/lib/analytics.ts` `track()` → `window.umami?.track()`. ~38 events cover the full funnel (auth → project → dataset → chart → share → pricing → purchase).

## Git Branching & Deployment

- **`main`** = production on **Vercel** (after the Netlify→Vercel cutover). GitHub integration is connected; pushes auto-deploy (previews for branches, production for `main`).
- **`migrate/next16`** = the migration branch (all Phase 1–4 work).
- **Supabase Edge Functions** deploy separately via `supabase functions deploy` — they do NOT auto-deploy from git.

## Gotchas

- **`cacheComponents` rejects `export const runtime` and `export const dynamic`** in route/segment config. Node is the default runtime; POST route handlers are dynamic. (A GET handler that reads `cookies()` gets prerendered and rejects — use POST or `connection()`.)
- **`alternates.canonical` on the root layout** and **`generateMetadata` that awaits `params`** both break `cacheComponents` — see `nextjs_cache_components_gotchas` memory / `PHASE_2D_HANDOFF.md`.
- `generateObject` IS present in `ai@6` (a validator plugin wrongly flags it as removed).
- `charts` and `datasets` tables have **no `user_id` column** — authorization is via RLS's project-ownership join, not a user_id filter. Only `projects` gets `.eq('user_id', ...)`.
- Stripe `stripe_customer_id` is mode-specific — a live customer id fails under a test key; `create-checkout-session` retrieves-or-recreates the customer.
- D3 generated code uses `var` (not `let`/`const`) for `new Function()` scope compatibility.
- `d3.annotation()` is NOT available — annotations must be manual SVG.
- Large datasets are sampled to 5000 rows for rendering (`dataSampler.ts`).
- Dataset row data (`parsedData`) is downloaded from Supabase Storage client-side, not server-hydrated.
- No automated tests exist in the repo.
