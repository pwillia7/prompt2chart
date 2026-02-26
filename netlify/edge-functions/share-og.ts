import type { Context } from "https://edge.netlify.com"

// Social crawler user-agents that read OG tags but don't execute JS
const BOT_PATTERNS = [
  'twitterbot', 'linkedinbot', 'facebookexternalhit', 'facebookbot',
  'whatsapp', 'slackbot', 'discordbot', 'telegrambot',
  'pinterest', 'googlebot', 'bingbot', 'applebot',
  'rogerbot', 'embedly', 'quora link preview', 'outbrain',
  'ia_archiver', 'vkshare', 'w3c_validator',
]

function isBot(ua: string): boolean {
  const lower = ua.toLowerCase()
  return BOT_PATTERNS.some(p => lower.includes(p))
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export default async (request: Request, context: Context) => {
  const ua = request.headers.get('user-agent') ?? ''
  if (!isBot(ua)) return context.next()

  // Extract shareId from path: /share/<shareId>
  const url = new URL(request.url)
  const parts = url.pathname.split('/').filter(Boolean)
  const shareId = parts[parts.length - 1]
  if (!shareId || parts[parts.length - 2] !== 'share') return context.next()

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !supabaseKey) return context.next()

  let share: { prompt: string; og_image_url: string | null } | null = null
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/shared_charts?id=eq.${encodeURIComponent(shareId)}&select=prompt,og_image_url&limit=1`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    )
    if (res.ok) {
      const rows = await res.json()
      if (rows.length > 0) share = rows[0]
    }
  } catch {
    return context.next()
  }

  if (!share) return context.next()

  const pageUrl = esc(request.url)
  const title = esc(`${share.prompt} — Prompt2Chart`)
  const description = esc('An AI-generated chart made with Prompt2Chart. View the interactive visualization and create your own from your data — free.')
  const imageUrl = share.og_image_url ? esc(share.og_image_url) : ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:site_name" content="Prompt2Chart">
${imageUrl ? `  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1400">
  <meta property="og:image:height" content="900">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${imageUrl}">` : `  <meta name="twitter:card" content="summary">`}
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:site" content="@prompt2chart">
</head>
<body>Loading chart...</body>
</html>`

  return new Response(html, {
    headers: { 'content-type': 'text/html;charset=utf-8' },
  })
}
