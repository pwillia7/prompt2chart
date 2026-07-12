# Next.js 16 Migration — Phase 2d Handoff

**Branch:** `migrate/next16` (unpushed, local only)
**Base:** `dev`
**As of:** 2026-07-11

## Where we are

- Phase 0 ✅ (Vercel project link)
- Phase 1 ✅ (Vite → Next 16 App Router full framework migration)
- Phase 2a ✅ (`@supabase/ssr` scaffold + proxy.ts + React 19 upgrade)
- Phase 2b (share fetch cache) — **folded into 2c.2**
- Phase 2c ✅ (cacheComponents enabled + share cached + server-auth for share/projects/dashboard)
- **Phase 2d — the one you're picking up** ⏳
- Phase 2e (server actions for mutations) — pending
- Phase 2f (final report) — pending
- Phase 3 (AI Gateway + Sandbox) — future
- Phase 4 (Verify & ship) — future

## Route table right now

```
┌ ○ /                              static
├ ○ /_not-found                    static
├ ○ /blog                          static (server component, fs read)
├ ◐ /blog/[slug]                   PPR (server + generateStaticParams)
├ ◐ /dashboard                     PPR (server auth, client body)
├ ○ /examples                      static
├ ○ /feedback                      static (client, guarded)
├ ○ /forgot-password               static
├ ○ /login                         static
├ ○ /pricing                       static (client, guarded)
├ ◐ /projects/[projectId]          PPR (server auth + notFound, client body)
├ ◐ /share/[shareId]               PPR (cached fetch, client interactive)
└ ○ /signup                        static
```

○ static · ◐ Partial Prerender · ƒ Proxy (Middleware) registered

## Two hard-won gotchas — read before touching cacheComponents

### 1. `alternates.canonical` in root layout is a hidden dynamic-metadata source

Any `alternates.canonical: '/'` or similar on the root layout forces implicit
per-URL resolution on dynamic-segment routes, cascading a `next-prerender-dynamic-metadata`
error to every `[slug]`/`[shareId]`/`[projectId]` page. **Do not add `alternates`
back to `app/layout.tsx`.** If you want per-page canonicals, put them on
individual page.tsx files that build the canonical from static data.

### 2. `generateMetadata` that awaits `params` is fatal under cacheComponents

The runtime tracks `hasDynamicMetadata` when metadata reads runtime data.
`await params` inside `generateMetadata` counts. Once `hasDynamicMetadata=true`,
the route needs `hasAllowedDynamic=true` (Suspense-wrapped dynamic access in the
body) to compensate. Empirically, no combination of DynamicMarker /
Suspense-wrapped Connection / cookies() at page level flipped it for these
routes. Only fix that worked: **remove `generateMetadata` entirely** and set
meta tags client-side (see `SharedChartInteractive.tsx` for the pattern).

Consequence: server-side per-share OG is regressed. `og_image_url` (stored in
the DB) + client-side meta mutation covers most crawlers. Pure-HTML crawlers
see root-layout generic OG.

## Phase 2d — what to do

Server-migrate the two data-heavy client routes so their data hydrates from
cached server fetches instead of client-side Supabase JS. Use `use cache: private`
for user-specific data.

### Files that need changes

**`app/dashboard/DashboardClient.tsx`**
- Currently: renders `<ProjectList />` which calls `useProjectStore.fetchProjects()`
  client-side.
- Change: accept `initialProjects: Project[]` as a prop. Hydrate the store from
  props (or bypass the store and render `<ProjectList projects={initialProjects} />`).
- `checkoutMessage` handling, `CreateProjectModal`, `SampleDataCards` stay client-side.

**`app/dashboard/page.tsx`**
- Currently: server auth check only, then renders `<DashboardClient />`.
- Add: `getUserProjects(userId)` helper — cached with `'use cache: private'` +
  `cacheTag(\`user-\${userId}-projects\`)` + `cacheLife('minutes')`.
- Pass `initialProjects` to `DashboardClient`.

**`app/projects/[projectId]/ProjectClient.tsx`**
- Currently: uses `useProjectStore.fetchProject(projectId)` +
  `useChartStore.fetchCharts(projectId)` + `useDatasetStore.fetchDatasets(projectId)`
  in a single big effect.
- Change: accept `initialProject`, `initialCharts`, `initialDatasets` as props.
  Hydrate stores or use the props directly.

**`app/projects/[projectId]/page.tsx`**
- Currently: server auth check + project existence check via `.select('id')`.
- Add: full `getProject(projectId, userId)` — cached private + tag
  `project-\${projectId}`. Include full row.
- Add: `getProjectCharts(projectId, userId)` — cached private + tag
  `project-\${projectId}-charts` + `cacheLife('minutes')`.
- Add: `getProjectDatasets(projectId, userId)` — same tag or separate.
- Pass all three to `ProjectClient`.

### Security audit (mandatory, per operating rules)

Before implementation, verify each new cached function against this table:

| Function | Data | Directive | Key inputs | Leak risk |
|---|---|---|---|---|
| `fetchShare(shareId)` (existing) | public | `use cache` shared | shareId | none — RLS anon SELECT |
| `getUserProjects(userId)` | per-user | `use cache: private` | cookie session (auto) | none if `private` |
| `getProject(projectId, userId)` | per-user | `use cache: private` | cookie session + projectId | verify user_id matches via query filter |
| `getProjectCharts(projectId, userId)` | per-user | `use cache: private` | cookie session + projectId | same |
| `getProjectDatasets(projectId, userId)` | per-user | `use cache: private` | cookie session + projectId | same |

**Rule:** every `use cache: private` fetch that touches per-user data MUST include
a `.eq('user_id', user.id)` filter (or equivalent) in the Supabase query. Never
trust that `cacheTag(\`user-\${userId}\`)` alone protects you — the tag scopes
invalidation, not authorization.

### Read cookies OUTSIDE the cached function

Cached functions cannot call `cookies()` / `headers()`. Read the user id in the
Page component (`const { data: { user } } = await supabase.auth.getUser()`),
then pass `user.id` as an argument to the cached function. Next auto-includes
the argument in the cache key.

```tsx
// page.tsx
export default async function Page() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const projects = await getUserProjects(user.id)  // cached, keyed by user.id
  return <DashboardClient initialProjects={projects} />
}

// Elsewhere, at module scope:
async function getUserProjects(userId: string) {
  'use cache: private'
  cacheTag(`user-${userId}-projects`)
  cacheLife('minutes')
  const supabase = await createSupabaseServerClient()  // reads cookies here too
  return supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .then(r => r.data ?? [])
}
```

Wait — `'use cache: private'` scopes to the cookie session, but the function
still calls `createSupabaseServerClient()` which reads cookies. Under `private`
that's allowed. Under regular `use cache`, it would fail.

### Mutations still go through Zustand + supabase-js in 2d

Server Actions with `revalidateTag` are 2e work. In 2d, after a user creates
a project or deletes a chart, the cached list will be stale until the page
reloads. Users will see the mutation reflected in the Zustand store (client
optimistic update), but a hard refresh would show cached-stale data until
2e wires the tag invalidation. Acceptable temporary state during migration.

### Verification before committing 2d

1. `next build` passes with 16 routes, no new PPR regressions.
2. `next dev` — create a project on dashboard, verify it appears (optimistic).
3. Hard refresh dashboard — verify project still appears (cached fetch returns).
4. Cannot easily test cache-per-user isolation in single-user local dev, but
   verify the query includes `.eq('user_id', ...)` — that's the actual protection.
5. Test `/projects/<random-uuid>` returns 404 (not-found) not another user's
   project.

## Phase 2e preview (for later)

Convert `projectStore.createProject/deleteProject`, `chartStore.createChart/
editChart/deleteChart` mutation methods to Server Actions. Each action performs
the write via server client, then calls `revalidateTag(\`user-\${userId}-projects\`)`
or `revalidateTag(\`project-\${projectId}-charts\`)`. Client keeps optimistic UI.

## Phase 2f preview (for later)

Final cache map + route table + Phase 1 vs Phase 2 bundle size comparison +
security audit summary + Phase 3 handoff (AI Gateway + Sandbox).

## Where to find things

- `src/lib/supabase.ts` — browser Supabase client (`createBrowserClient`)
- `src/lib/supabase-server.ts` — server client (per-request, cookie-scoped)
- `src/lib/supabase-middleware.ts` — session refresh helper
- `proxy.ts` — Next 16 middleware that calls the session refresh
- `src/store/*.ts` — Zustand stores (still client-side data fetch in 2c)
- `app/dashboard/*.tsx` — server + client split
- `app/projects/[projectId]/*.tsx` — server + client split, no data fetch yet
- `app/share/[shareId]/*.tsx` — cached server body + client interactive (done)

## Environment

- Node ≥ 20.9 required
- Next `16.2.10` · React `19.2.7` · `@supabase/ssr` `0.12.0` · `@supabase/supabase-js` `2.108+`
- Vercel project: `prompt2chart-next16` (id `prj_dsHg2Aylm9YzQqDXhEw1IE7A23YO`)
- GitHub auto-deploy: disabled. Re-enable with
  `vercel git connect https://github.com/pwillia7/prompt2chart` when done.
- Local env: `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `VERCEL_OIDC_TOKEN`. All also live on the
  Vercel project across prod + preview + dev.

## Commit log for the branch

```
ff2233c fix(share): restore client-side OG meta mutation
c6822ab feat(migration): 2c.3 — dashboard server-side auth check
7a6e11f feat(migration): 2c.2 — enable cacheComponents; cache share fetch; server-auth projects
9893bb0 refactor(migration): 2c.1 — server-migrate share body
ff007bb feat(migration): 2a — @supabase/ssr scaffold + proxy (cacheComponents deferred)
d7c557e chore(migration): 1f.3 — ESLint 9 + eslint-config-next
0a8463e chore(migration): 1f.2 — delete Vite tree
ce32aab refactor(migration): 1f.1 — flatten src/views/ into app/**/page.tsx
6b7a30a feat(migration): 1e — replace Netlify share-og with Next generateMetadata
5e7ec17 feat(migration): 1d.4 — port Batch 2 (Dashboard + ProjectPage)
b8b95f7 refactor(migration): 1d.3 — blog as server components; drop vite-env.d.ts
141867a feat(migration): 1d.2 — port Batch 1 views + wire app router pages
fa4043e chore: un-track test_data/ (swept into prior commit by mistake)
e3740fe refactor(migration): 1d.1 — port shared components off react-router-dom
8470bf0 feat(migration): Phase 1c — auth provider + layout wiring
bb5be46 feat(migration): Phase 1b — env rename, head content, next/font, globals.css
cec16dc feat(migration): Phase 1a — scaffold Next.js 16 alongside Vite
e39f250 chore(migration): Phase 0 — link to Vercel project prompt2chart-next16
```
