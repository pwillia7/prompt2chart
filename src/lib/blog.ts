import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export interface BlogPost {
  slug: string
  date: string
  title: string
  description: string
  raw: string
}

const BLOG_DIR = join(process.cwd(), 'src', 'blog')

function extractTitle(raw: string): string {
  const match = raw.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : 'Untitled'
}

function extractDescription(raw: string): string {
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
  const files = readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'))
  const posts: BlogPost[] = []

  for (const file of files) {
    const filename = file.replace(/\.md$/, '')
    const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/)
    if (!dateMatch) continue

    const [, date, slug] = dateMatch
    const raw = readFileSync(join(BLOG_DIR, file), 'utf8')

    posts.push({
      slug,
      date,
      title: extractTitle(raw),
      description: extractDescription(raw),
      raw,
    })
  }

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
