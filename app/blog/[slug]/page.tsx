import type { Metadata } from 'next'
import { BlogPostPage } from '@/views/BlogPostPage'
import { getAllPosts, getPost } from '@/lib/blog'

type Params = Promise<{ slug: string }>

export function generateStaticParams() {
  return getAllPosts().map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return { title: 'Not Found - Prompt2Chart' }
  return {
    title: `${post.title} - Prompt2Chart`,
    description: post.description,
  }
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params
  return <BlogPostPage slug={slug} />
}
