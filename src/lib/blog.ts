export interface BlogPost {
  slug: string
  date: string
  title: string
  description: string
  raw: string
}

// Import all markdown files at build time — content lands in the JS bundle
// so Google's first-pass crawl sees the full article text.
const modules = import.meta.glob('../blog/*.md', { query: '?raw', import: 'default', eager: true })

function extractTitle(raw: string): string {
  const match = raw.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : 'Untitled'
}

function extractDescription(raw: string): string {
  // Skip heading lines and blank lines, take the first real paragraph
  const lines = raw.split('\n')
  const paragraphLines: string[] = []
  let inParagraph = false

  for (const line of lines) {
    if (line.startsWith('#') || line.startsWith('!')) continue
    if (line.trim() === '') {
      if (inParagraph) break
      continue
    }
    inParagraph = true
    paragraphLines.push(line.trim())
  }

  const text = paragraphLines.join(' ').replace(/\*\*|__|`|\[([^\]]+)\]\([^)]+\)/g, '$1')
  return text.length > 160 ? text.slice(0, 157) + '...' : text
}

export function getAllPosts(): BlogPost[] {
  const posts: BlogPost[] = []

  for (const [path, raw] of Object.entries(modules) as [string, string][]) {
    // path is like ../blog/2026-02-23-how-to-make-a-scatter-plot.md
    const filename = path.split('/').pop()!.replace('.md', '')
    const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/)
    if (!dateMatch) continue

    const [, date, slug] = dateMatch

    posts.push({
      slug,
      date,
      title: extractTitle(raw),
      description: extractDescription(raw),
      raw,
    })
  }

  // Newest first
  return posts.sort((a, b) => b.date.localeCompare(a.date))
}

export function getPost(slug: string): BlogPost | undefined {
  return getAllPosts().find(p => p.slug === slug)
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
