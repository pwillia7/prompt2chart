// LLM calls routed through Vercel AI Gateway (ai SDK v6). Replaces the Deno
// OpenAI/Anthropic provider classes in supabase/functions/_shared/llm-adapter.ts.
// Auth is OIDC (VERCEL_OIDC_TOKEN) or a static AI_GATEWAY_API_KEY — resolved by
// the ai SDK; no provider keys needed here. Model slugs are `provider/model`.
import { generateObject, generateText } from 'ai'
import type { DatasetSchema, ChartLibrary, InsightSuggestion } from '@/types'
import type { AllSchemaEntry, ChatMessage, ChartResponse } from './types'
import {
  SYSTEM_PROMPT_D3,
  SYSTEM_PROMPT_VEGA,
  SYSTEM_PROMPT_INSIGHTS,
  buildChartPrompt,
  buildSchemaDescription,
  formatOtherSchemas,
} from './prompts'

const GEN_MODEL = process.env.LLM_MODEL || 'anthropic/claude-sonnet-5'
const CHAT_MODEL = process.env.LLM_CHAT_MODEL || 'anthropic/claude-haiku-4.5'
const TIMEOUT_MS = 45_000

function gatewayOptions(feature: string, userId?: string) {
  return {
    gateway: {
      tags: [`feature:${feature}`],
      ...(userId ? { user: userId } : {}),
    },
  }
}

export async function generateChart(
  prompt: string,
  schema: DatasetSchema,
  library: ChartLibrary = 'vega-lite',
  existingCode?: string,
  allSchemas?: AllSchemaEntry[],
  userId?: string,
): Promise<ChartResponse> {
  const system = library === 'd3' ? SYSTEM_PROMPT_D3 : SYSTEM_PROMPT_VEGA
  const userMessage = buildChartPrompt(prompt, schema, library, existingCode, allSchemas)

  const { object } = await generateObject({
    model: GEN_MODEL,
    output: 'no-schema',
    system,
    prompt: userMessage,
    temperature: 0.3,
    maxOutputTokens: 4096,
    maxRetries: 2,
    abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    providerOptions: gatewayOptions('generate-chart', userId),
  })

  return mapChartResponse((object ?? {}) as Record<string, unknown>, library)
}

export async function suggestInsights(
  schema: DatasetSchema,
  allSchemas?: AllSchemaEntry[],
  userId?: string,
): Promise<InsightSuggestion[]> {
  let userMessage = `Here is the dataset schema:\n${buildSchemaDescription(schema)}`
  userMessage += formatOtherSchemas(schema, allSchemas)
  userMessage += `\n\nSuggest 5 visualizations with a mix of vega-lite and d3 libraries. Return a JSON object with a "suggestions" array.`

  const { object } = await generateObject({
    model: GEN_MODEL,
    output: 'no-schema',
    system: SYSTEM_PROMPT_INSIGHTS,
    prompt: userMessage,
    temperature: 0.3,
    maxOutputTokens: 4096,
    maxRetries: 2,
    abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    providerOptions: gatewayOptions('suggest-insights', userId),
  })

  return mapInsights(object)
}

export async function analystChat(
  systemPrompt: string,
  messages: ChatMessage[],
  userId?: string,
): Promise<string> {
  const { text } = await generateText({
    model: CHAT_MODEL,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    temperature: 0.5,
    maxOutputTokens: 1024,
    maxRetries: 2,
    abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    providerOptions: gatewayOptions('analyst-chat', userId),
  })

  return text
}

// --- response mapping (mirrors the old parseChartResponse / parseInsightsResponse) ---

function mapChartResponse(parsed: Record<string, unknown>, library: ChartLibrary): ChartResponse {
  if (library === 'd3') {
    return {
      chartType: (parsed.chartType as string) || 'bar',
      library: 'd3',
      d3Code: (parsed.d3Code as string) || '',
      reasoning: (parsed.reasoning as string) || '',
      suggestedFollowups: (parsed.suggestedFollowups as string[]) || [],
    }
  }

  return {
    chartType: (parsed.chartType as string) || 'bar',
    library: 'vega-lite',
    vegaLiteSpec: (parsed.vegaLiteSpec as ChartResponse['vegaLiteSpec']) || {},
    reasoning: (parsed.reasoning as string) || '',
    suggestedFollowups: (parsed.suggestedFollowups as string[]) || [],
  }
}

function mapInsights(parsed: unknown): InsightSuggestion[] {
  const root = parsed as { suggestions?: unknown } | unknown[]
  const suggestions = Array.isArray(root) ? root : (root as { suggestions?: unknown }).suggestions
  if (!Array.isArray(suggestions)) return []
  return suggestions.slice(0, 5).map((raw) => {
    const s = raw as Record<string, string>
    return {
      prompt: s.prompt || '',
      description: s.description || s.title || '',
      chartType: s.chartType || s.chart_type || 'bar',
      library: (s.library as ChartLibrary) || 'vega-lite',
    }
  })
}
