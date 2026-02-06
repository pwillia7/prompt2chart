# Prompt2Chart

AI-powered data visualization tool that generates interactive charts from natural language prompts using D3.js and Vega-Lite.

## Features

- Natural language to chart generation using OpenAI or Anthropic
- CSV and JSON data file support with automatic schema detection
- **D3.js** interactive visualizations with zoom, pan, brushing, tooltips, and animations
- **Vega-Lite** declarative chart support
- Iterative chart refinement — edits preserve existing features by default
- Pan/Select mode toggle for charts with both zoom and brush
- AI-suggested visualizations based on your data
- Project-based organization
- Secure user authentication

## Tech Stack

- **Frontend:** React + Vite + TypeScript + TailwindCSS + Zustand
- **Backend:** Supabase (Auth, Postgres, Storage, Edge Functions)
- **Visualization:** D3.js v7 (interactive), Vega-Lite v5 (declarative)
- **LLM:** Configurable adapter (OpenAI + Anthropic)

## Prerequisites

- Node.js 18+
- Docker Desktop (for local Supabase)
- Supabase CLI (`npm install -g supabase`)

## Getting Started

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd prompt2chart
npm install
```

### 2. Start Local Supabase

```bash
supabase start
```

This will output your local Supabase credentials. Note the `anon key` and `API URL`.

### 3. Configure Environment Variables

Create `.env.local` in the project root:

```
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<your-anon-key-from-supabase-start>
```

Create `supabase/.env` for Edge Functions:

```
LLM_PROVIDER=openai  # or "anthropic"
OPENAI_API_KEY=<your-openai-api-key>
ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

### 4. Apply Database Migrations

```bash
supabase db reset
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to access the application.

## Architecture

### D3 Chart Rendering

Generated D3 code runs in a sandboxed `Function` constructor with injected variables (`d3`, `svg`, `data`, `width`, `height`, `margin`, `container`). The renderer handles:

- **Data safety:** `structuredClone` prevents generated code from mutating shared state
- **Cleanup:** Unmount removes all DOM elements and event listeners
- **Brush/zoom conflict resolution:** `stopPropagation` on brush overlays prevents drag events from reaching the SVG's zoom handler

### Interactivity Patterns

The LLM system prompt provides structured patterns for:

- **Zoom + Pan:** Semantic zoom with `rescaleX/Y`, no `translateExtent` for free panning
- **Brushing / Selection:** Pan/Select mode toggle toolbar, zoom-aware brush scales using `d3.zoomTransform`
- **Tooltips:** Positioned via `d3.pointer` relative to the container div
- **Annotations:** Manual SVG lines, text, and callout boxes (d3-annotation is not bundled)

### Chart Edit Preservation

When editing an existing chart, the LLM receives the current code with explicit instructions to preserve all existing features and only modify what was requested.

## Project Structure

```
prompt2chart/
├── src/
│   ├── components/     # React components
│   │   ├── auth/       # Authentication components
│   │   ├── charts/     # Chart rendering and prompts
│   │   ├── datasets/   # Dataset upload and display
│   │   ├── layout/     # Layout components
│   │   ├── projects/   # Project management
│   │   └── ui/         # Reusable UI components
│   ├── lib/            # Utilities and helpers
│   ├── pages/          # Page components
│   ├── store/          # Zustand state stores
│   └── types/          # TypeScript types
├── supabase/
│   ├── functions/      # Edge Functions
│   │   ├── generate-chart/
│   │   ├── suggest-insights/
│   │   └── _shared/    # Shared LLM adapter and system prompts
│   └── migrations/     # Database migrations
└── public/             # Static assets
```

## Edge Functions

### generate-chart

Generates D3.js code or Vega-Lite specs from natural language prompts. Supports editing existing charts by passing `existingCode`.

**Request:**
```json
{
  "prompt": "Show monthly sales trend",
  "schema": { "columns": [...], "rowCount": 1000 },
  "library": "d3",
  "existingCode": null
}
```

### suggest-insights

Generates visualization suggestions based on dataset schema.

## Deployment

### Production Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Link your local project:
   ```bash
   supabase link --project-ref <project-id>
   ```
3. Push migrations:
   ```bash
   supabase db push
   ```
4. Deploy Edge Functions:
   ```bash
   supabase functions deploy
   ```
5. Set Edge Function secrets:
   ```bash
   supabase secrets set OPENAI_API_KEY=<your-key>
   supabase secrets set LLM_PROVIDER=openai
   ```

### Frontend Deployment

Build the production bundle:
```bash
npm run build
```

Deploy the `dist/` folder to Vercel, Netlify, or your preferred hosting.

Update `.env.production` with your production Supabase URL and anon key.

## License

MIT
