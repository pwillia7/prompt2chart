import { useMemo, useEffect } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { marked } from 'marked'
import { getPost, formatDate } from '../lib/blog'

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const post = slug ? getPost(slug) : undefined

  const html = useMemo(() => {
    if (!post) return ''
    return marked.parse(post.raw) as string
  }, [post])

  // Set document title and meta description dynamically
  useEffect(() => {
    if (!post) return
    document.title = `${post.title} - Prompt2Chart`
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (meta) meta.content = post.description
  }, [post])

  if (!post) return <Navigate to="/blog" replace />

  return (
    <div className="min-h-screen bg-bg">
      {/* Nav */}
      <nav className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
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
              to="/login"
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-fast"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-[10px] hover:bg-[var(--primary-hover)] transition-colors duration-fast"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link
            to="/blog"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-fast"
          >
            ← Blog
          </Link>
        </nav>

        {/* Article header */}
        <header className="mb-10">
          <time className="text-sm text-[var(--text-subtle)]">{formatDate(post.date)}</time>
        </header>

        {/* Article body — prose styles from @tailwindcss/typography */}
        <article
          className="prose prose-neutral max-w-none
            prose-headings:text-[var(--text)] prose-headings:font-semibold
            prose-p:text-[var(--text-muted)] prose-p:leading-relaxed
            prose-a:text-[var(--primary)] prose-a:no-underline hover:prose-a:underline
            prose-strong:text-[var(--text)]
            prose-code:text-[var(--text)] prose-code:bg-[var(--surface-2)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-normal prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-[var(--surface-2)] prose-pre:border prose-pre:border-[var(--border)]
            prose-blockquote:border-l-[var(--primary)] prose-blockquote:text-[var(--text-muted)]
            prose-li:text-[var(--text-muted)]
            prose-hr:border-[var(--border)]
            prose-img:rounded-card prose-img:shadow-soft"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* CTA */}
        <div className="mt-16 rounded-card bg-[var(--surface-2)] border border-[var(--border)] p-8 text-center">
          <h2 className="text-xl font-semibold text-[var(--text)] mb-2">
            Try it yourself — free
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Upload your data and describe the chart you want. 100 free credits included, no credit card required.
          </p>
          <Link
            to="/signup"
            className="inline-block px-6 py-2.5 bg-[var(--primary)] text-white text-sm font-medium rounded-[10px] hover:bg-[var(--primary-hover)] transition-colors duration-fast"
          >
            Get Started Free →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 bg-[var(--surface-1)] mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 100 100">
              <rect x="10" y="60" width="15" height="30" fill="#FDBA74" />
              <rect x="30" y="40" width="15" height="50" fill="#FB923C" />
              <rect x="50" y="20" width="15" height="70" fill="#F97316" />
              <rect x="70" y="35" width="15" height="55" fill="#EA580C" />
            </svg>
            <span className="text-sm font-medium text-[var(--text-subtle)]">Prompt2Chart</span>
          </div>
          <p className="text-sm text-[var(--text-subtle)]">
            &copy; {new Date().getFullYear()} Prompt2Chart. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
