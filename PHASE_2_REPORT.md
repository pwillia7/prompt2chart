# Next.js 16 Migration — Phase 2 Final Report (2f)

**Branch:** `migrate/next16` (unpushed, local only)
**Base:** `dev`
**As of:** 2026-07-11
**Next.js:** 16.2.10 · React 19.2.7 · `@supabase/ssr` 0.12.0

## Status

| Phase | State | Summary |
|---|---|---|
| 0 | ✅ | Vercel project link (`prompt2chart-next16`) |
| 1 | ✅ | Vite → Next 16 App Router full framework migration |
| 2a | ✅ | `@supabase/ssr` scaffold + `proxy.ts` + React 19 |
| 2c | ✅ | `cacheComponents` enabled; share fetch cached; server-auth for share/projects/dashboard |
| 2d | ✅ | Dashboard + project pages hydrate from cached server fetches |
| 2e | ✅ | `updateTag` Server Actions invalidate the 2d tags on mutation |
| 2f | ✅ | This report |
| 3 | ⏳ | AI Gateway + Sandbox (future — needs its own plan) |
| 4 | ⏳ | Verify & ship (Netlify → Vercel cutover) |

Phase 2 commits: `3a8cbab` (2d.1) · `f33e05b` (2d.2) · `d573dc1` (2e). Earlier 2a/2c commits precede these on the branch.

## Route table

```
┌ ○ /                              static
├ ○ /_not-found                    static
├ ○ /blog                          static (server component, fs read)
├ ◐ /blog/[slug]                   PPR (server + generateStaticParams)
├ ◐ /dashboard                     PPR (server auth + cached projects, client body)
├ ○ /examples                      static
├ ○ /feedback                      static (client, guarded)
├ ○ /forgot-password               static
├ ○ /login                         static
├ ○ /pricing                       static (client, guarded)
├ ◐ /projects/[projectId]          PPR (server auth + cached project/charts/datasets, client body)
├ ◐ /share/[shareId]               PPR (cached public fetch, client interactive)
└ ○ /signup                        static
```

○ static · ◐ Partial Prerender · ƒ Proxy (Middleware) registered · 16 routes, `next build` green.

> Byte-level First-Load-JS comparison vs the pre-caching tree was **not** gathered — it requires a separate build of an earlier commit. The meaningful architectural outcome is the static/PPR split above: every data route is now a PPR shell that streams its dynamic/private parts, rather than a client-only SPA shell that fetched everything after hydration.

## Cache & tag map

| Fetcher / action | File | Directive | Tag | Lifetime | Invalidated by |
|---|---|---|---|---|---|
| `getShare(shareId)` | `app/share/[shareId]/page.tsx` | `use cache` (shared) | `share-${shareId}` | `days` | — (immutable snapshot) |
| `getUserProjects(userId)` | `app/dashboard/page.tsx` | `use cache: private` | `user-${userId}-projects` | `minutes` | `bustUserProjects()` |
| `getProject(projectId, userId)` | `app/projects/[projectId]/page.tsx` | `use cache: private` | `project-${projectId}` | `minutes` | `bustProject(id)` |
| `getProjectCharts(projectId, _userId)` | `app/projects/[projectId]/page.tsx` | `use cache: private` | `project-${projectId}-charts` | `minutes` | `bustProjectCharts(id)` |
| `getProjectDatasets(projectId, _userId)` | `app/projects/[projectId]/page.tsx` | `use cache: private` | `project-${projectId}-datasets` | `minutes` | `bustProjectDatasets(id)` |

**Invalidation wiring** (`src/lib/cacheActions.ts`, all `'use server'`, all via `updateTag`):

| Zustand mutation | Store | Busts |
|---|---|---|
| `createProject` / `deleteProject` | `projectStore` | `bustUserProjects` |
| `updateProject` | `projectStore` | `bustUserProjects` + `bustProject` |
| `generateChart` / `updateChart` / `deleteChart` | `chartStore` | `bustProjectCharts` |
| `uploadDataset` / `deleteDataset` | `datasetStore` | `bustProjectDatasets` |

### Two load-bearing facts about the cache model (Next 16.2.10 docs)

1. **`use cache: private` is browser-memory only** and does not persist across page reloads; it re-executes on every server render and is excluded from static-shell generation. So a hard refresh always re-runs these fetchers fresh — there is no server-persisted stale-until-reload window. The staleness that `updateTag` closes is **soft (client-side) navigation**, where the router holds the RSC payload in browser memory (min 30s stale).
2. **`updateTag` (not `revalidateTag`)** is the read-your-own-writes primitive and must be called from a Server Action. That's why 2e uses thin `'use server'` actions rather than `revalidateTag`.

## Security audit summary

All cached per-user fetchers use `'use cache: private'`, and the Supabase server client (`createSupabaseServerClient`) is cookie-scoped with the **anon key**, so Postgres RLS is enforced on every query. Authorization by table:

| Data | Table has `user_id`? | Enforcement |
|---|---|---|
| Projects | **Yes** | Explicit `.eq('user_id', userId)` **plus** RLS `auth.uid() = user_id`. `getProject` → `null` ⇒ `notFound()`. |
| Charts | **No** (only `project_id`) | RLS `EXISTS (… projects.user_id = auth.uid())` **plus** the page proves ownership via `getProject` before fetching. |
| Datasets | **No** (only `project_id`) | Same as charts. |
| Shares | Public read | RLS anon `SELECT` on `shared_charts`; `getShare` uses shared (non-private) `use cache`. |

- **Correction to the 2d handoff:** its rule "every private fetch must include `.eq('user_id', user.id)`" is impossible for charts/datasets — they have no `user_id` column. Their protection is RLS's project-ownership join + the ownership gate, not a user_id filter.
- **`updateTag` actions:** `bustUserProjects` reads the user id from the session (never a client argument). Project-scoped bust actions take a `projectId` from the client, but busting a cache tag you don't own only invalidates cache (no data exposure), so no ownership check is required there.
- **Cache-key isolation:** private entries are keyed per session; `userId` is included in each fetcher's signature so there is no cross-user cache-key collision.

## Known limitations / deferred

- **Dataset file bodies stay client-side.** `parsedData` (the rows fed to the chart renderers) is downloaded from Supabase **Storage** and parsed in `datasetStore.loadDatasetData` on the client. 2d/2e hydrate only the DB rows; the project page still does one client Storage round-trip per selected dataset. Server-fetching the file body was deliberately out of scope.
- **Writes remain client-side supabase-js.** 2e chose the "thin" option: mutations still write via the browser client (RLS-protected) and then call an `updateTag` action. DB writes were not moved into Server Actions. Dataset upload (a `File`) in particular is awkward to move server-side and would stay client either way.
- **Per-share server OG is still regressed** (from 2c): `generateMetadata` awaiting `params` is fatal under `cacheComponents`, so share pages set meta tags client-side. Pure-HTML crawlers see the root-layout generic OG. Revisit with each Next 16.x release.
- **Not verified locally:** authenticated flows (create/delete project + chart, soft-nav round-trip consistency, owned-project load) need a real Supabase session on the remote dev box. Build/type/lint/boot are all green here.

## Phase 3 handoff (AI Gateway + Sandbox)

Not started. Scope to plan next session:

- **AI Gateway** — route the LLM calls in `supabase/functions/_shared/llm-adapter.ts` (currently direct OpenAI/Anthropic via `LLM_PROVIDER`) through Vercel AI Gateway for a unified API, observability, and model fallbacks. Open question: keep generation in Supabase Edge Functions (Deno) or move to Next Route Handlers / Server Actions on Vercel Fluid Compute. The three functions in play: `generate-chart`, `analyst-chat`, `suggest-insights`.
- **Sandbox** — the generated D3 code currently runs client-side in a `new Function()` sandbox (`D3ChartRenderer.tsx`). Evaluate Vercel Sandbox for executing untrusted generated code server-side (e.g. for server-rendered thumbnails / OG images, or safer validation) vs. keeping the client sandbox.
- **Prereq for cutover (Phase 4):** re-enable GitHub auto-deploy with `vercel git connect https://github.com/pwillia7/prompt2chart`; `main`/Netlify stays production until the cutover.

## Environment / operational notes

- Vercel project `prompt2chart-next16` (id `prj_dsHg2Aylm9YzQqDXhEw1IE7A23YO`); GitHub auto-deploy currently **disabled**.
- `.env.local` and the Vercel project (prod + preview + dev) carry `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `VERCEL_OIDC_TOKEN`.
- Supabase Edge Functions deploy separately via `supabase functions deploy` — not from git.
- Node ≥ 20.9 required.
