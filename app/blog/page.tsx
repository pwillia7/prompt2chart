import type { Metadata } from 'next'
import { BlogIndexPage } from '@/views/BlogIndexPage'

export const metadata: Metadata = {
  title: 'Blog - Prompt2Chart',
  description: 'Guides and tips for data visualization.',
}

export default function Page() {
  return <BlogIndexPage />
}
