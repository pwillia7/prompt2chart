# CLAUDE.md - prompt2chart

## What This Project Is

A web app that generates interactive data visualizations from natural language prompts. Users upload CSV/JSON datasets, type what they want to see, and an LLM generates D3.js or Vega-Lite chart code.

## Tech Stack

- **Frontend:** React 18 + TypeScript, Vite, TailwindCSS
- **Backend:** Supabase (Auth, PostgreSQL, Storage, Edge Functions on Deno)
- **Charts:** D3.js v7 (code generation), Vega-Lite v5 (spec generation)
- **State:** Zustand stores (no Redux, no Context)
- **LLM:** OpenAI or Anthropic via Supabase Edge Functions

## Commands

```bash
npm run dev        # Dev server on port 5173
npm run build      # tsc + vite build
npm run lint       # ESLint
npx tsc --noEmit   # Type check only
```

Supabase Edge Functions are deployed separately and run on Deno (not Node).

## Project Structure

```
src/
  components/
    auth/       # AuthGuard, LoginForm, SignupForm
    charts/     # D3ChartRenderer, ChartRenderer (Vega), ChartPromptInput,
                # InsightSuggestions, AnalystNotes, ExportMenu
    datasets/   # DatasetUploader, DataPreview, SchemaDisplay
    layout/     # Layout, Header
    projects/   # ProjectList, ProjectCard, CreateProjectModal
    ui/         # Button, Input, Modal, Spinner
  lib/          # Utilities: schemaGenerator, chartExporter, vegaHelpers,
                # dataSampler, supabase client, usageTracker
  pages/        # DashboardPage, ProjectPage, LoginPage, SignupPage
  store/        # Zustand: authStore, projectStore, chartStore, datasetStore
  types/        # All TypeScript interfaces (index.ts)

supabase/
  functions/
    generate-chart/    # LLM chart generation
    analyst-chat/      # Q&A about charts
    suggest-insights/  # Visualization suggestions for a dataset
    _shared/           # llm-adapter.ts (system prompts + LLM calls), cors.ts
```

## Architecture: How Chart Generation Works

1. User types a prompt in `ProjectPage.tsx`
2. `chartStore.generateChart()` calls the `generate-chart` Edge Function
3. Edge Function (`llm-adapter.ts`) sends the prompt + dataset schema + system prompt to the LLM
4. LLM returns either D3 code (string) or a Vega-Lite spec (JSON)
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

`supabase/functions/_shared/llm-adapter.ts` contains two large system prompts that are critical to code quality:

- **SYSTEM_PROMPT_D3** (~490 lines): D3 code generation rules, interactivity patterns (zoom, brush, tooltips), legend patterns, multi-chart layout, style guidelines, and 8 Critical Rules
- **SYSTEM_PROMPT_VEGA**: Vega-Lite spec generation rules

Changes to these prompts directly affect every chart generated. Keep them concise — verbose sections cause attention dilution and degrade LLM output quality.

## Environment Variables

**Frontend** (`.env.local`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Edge Functions** (Supabase secrets):
- `LLM_PROVIDER` ("openai" or "anthropic")
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`

## Styling

All TailwindCSS, no custom CSS files. Custom `primary` color scale (sky blue). Common patterns:
- Cards: `bg-white rounded-lg border border-gray-200 p-4`
- Button variants: primary (blue), secondary (gray), ghost, danger

## Export

Charts export to PNG, SVG, HTML, and raw code. PNG/SVG exports capture only the SVG element — HTML legends won't appear in those formats. HTML export captures the full container and works correctly.

## Gotchas

- `llm-adapter.ts` runs on **Deno**, not Node — use Deno-compatible imports
- D3 generated code uses `var` (not `let`/`const`) because the system prompt instructs this for Function constructor compatibility
- `d3.annotation()` is NOT available — annotations must be manual SVG
- Large datasets are sampled to 5000 rows for rendering (`dataSampler.ts`)
- The `chartStore.ts` file has a pre-existing uncommitted change to `parent_chart_id` handling
- No tests exist in the repo
