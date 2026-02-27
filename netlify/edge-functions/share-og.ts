import type { Context } from "https://edge.netlify.com"

const STATIC_OG_IMAGE = 'https://prompt2chart.com/og-image.png'

const BOT_PATTERNS = [
  'twitterbot', 'linkedinbot', 'facebookexternalhit', 'facebookbot',
  'whatsapp', 'slackbot', 'discordbot', 'telegrambot',
  'pinterest', 'googlebot', 'bingbot', 'applebot',
  'rogerbot', 'embedly', 'quora link preview', 'outbrain',
  'ia_archiver', 'vkshare', 'w3c_validator', 'redditbot',
  // Bluesky link preview crawler
  'bsky', 'cardyb',
]

function isBot(ua: string, agentCategory: string): boolean {
  const lower = ua.toLowerCase()
  if (agentCategory.toLowerCase().includes('social')) return true
  return BOT_PATTERNS.some(p => lower.includes(p))
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildDescription(projectName?: string): string {
  if (projectName) {
    return esc(`Check out "${projectName}" — a chart I built with Prompt2Chart by typing what I wanted to see from my data.`)
  }
  return esc('Check out this chart I built with Prompt2Chart — just described what I wanted to see from my data and AI built it instantly.')
}

function ogHtml(title: string, description: string, pageUrl: string, imageUrl?: string): Response {
  const imgSrc = imageUrl || STATIC_OG_IMAGE
  const imgAlt = esc('AI-generated data visualization from Prompt2Chart')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Prompt2Chart">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:image" content="${imgSrc}">
  <meta property="og:image:alt" content="${imgAlt}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@prompt2chart">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imgSrc}">
  <meta name="twitter:image:alt" content="${imgAlt}">
</head>
<body>Loading chart...</body>
</html>`

  return new Response(html, {
    headers: { 'content-type': 'text/html;charset=utf-8' },
  })
}

export default async (request: Request, context: Context) => {
  const ua = request.headers.get('user-agent') ?? ''
  const agentCategory = request.headers.get('netlify-agent-category') ?? ''
  if (!isBot(ua, agentCategory)) return context.next()

  // Extract shareId: /share/<shareId>
  const url = new URL(request.url)
  const parts = url.pathname.split('/').filter(Boolean)
  const shareId = parts[parts.length - 1]
  if (!shareId || parts[parts.length - 2] !== 'share') return context.next()

  const pageUrl = esc(request.url)
  const genericTitle = esc('Shared Chart — Prompt2Chart')
  const genericDesc = buildDescription()

  // Without env vars, return generic OG tags with static image fallback
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !supabaseKey) {
    return ogHtml(genericTitle, genericDesc, pageUrl)
  }

  // Fetch chart-specific data including project_name
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/shared_charts?id=eq.${encodeURIComponent(shareId)}&select=prompt,project_name,og_image_url&limit=1`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    )
    if (res.ok) {
      const rows = await res.json()
      if (rows.length > 0) {
        const share = rows[0]
        // Use project name as title when available — the prompt is often long and reads poorly as a social title
        const displayName = share.project_name || null
        const title = esc(displayName ? `${displayName} — Prompt2Chart` : `${share.prompt} — Prompt2Chart`)
        const desc = buildDescription(displayName ?? undefined)
        const imageUrl = share.og_image_url ? esc(share.og_image_url) : undefined
        return ogHtml(title, desc, pageUrl, imageUrl)
      }
    }
  } catch {
    // fall through to generic
  }

  return ogHtml(genericTitle, genericDesc, pageUrl)
}
