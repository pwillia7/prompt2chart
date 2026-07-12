import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts, formatDate } from '@/lib/blog'
import { MarketingFooter } from '@/components/layout/MarketingFooter'

export const metadata: Metadata = {
  title: 'Blog - Prompt2Chart',
  description: 'Guides and tips for data visualization.',
}

export default function Page() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen bg-bg">
      {/* Nav */}
      <nav className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <svg className="w-7 h-7" viewBox="0 0 100 100">
              <rect x="10" y="60" width="15" height="30" fill="#FDBA74" />
              <rect x="30" y="40" width="15" height="50" fill="#FB923C" />
              <rect x="50" y="20" width="15" height="70" fill="#F97316" />
              <rect x="70" y="35" width="15" height="55" fill="#EA580C" />
            </svg>
            <span className="text-lg font-semibold text-[var(--text)]">Prompt2Chart</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-fast"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-[10px] hover:bg-[var(--primary-hover)] transition-colors duration-fast"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-[var(--text)] mb-2">Blog</h1>
        <p className="text-[var(--text-muted)] mb-12">
          Guides and tips for data visualization.
        </p>

        {posts.length === 0 ? (
          <p className="text-[var(--text-muted)]">No posts yet.</p>
        ) : (
          <div className="space-y-8">
            {posts.map(post => (
              <article key={post.slug} className="group">
                <Link href={`/blog/${post.slug}`} className="block">
                  <time className="text-xs text-[var(--text-subtle)] mb-1 block">
                    {formatDate(post.date)}
                  </time>
                  <h2 className="text-xl font-semibold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors duration-fast mb-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    {post.description}
                  </p>
                  <span className="mt-3 inline-block text-sm font-medium text-[var(--primary)]">
                    Read more →
                  </span>
                </Link>
                <div className="mt-8 border-t border-[var(--border)]" />
              </article>
            ))}
          </div>
        )}
      </main>

      <MarketingFooter />
    </div>
  )
}
