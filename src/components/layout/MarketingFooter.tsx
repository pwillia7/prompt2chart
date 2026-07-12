import Link from 'next/link'

const CURRENT_YEAR = new Date().getFullYear()

export function MarketingFooter() {
  return (
    <footer className="bg-[var(--surface-1)] border-t border-[var(--border)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">

          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-3">
              <svg className="w-6 h-6 shrink-0" viewBox="0 0 100 100">
                <rect x="10" y="60" width="15" height="30" fill="#FDBA74" />
                <rect x="30" y="40" width="15" height="50" fill="#FB923C" />
                <rect x="50" y="20" width="15" height="70" fill="#F97316" />
                <rect x="70" y="35" width="15" height="55" fill="#EA580C" />
              </svg>
              <span className="text-sm font-semibold text-[var(--text-muted)]">Prompt2Chart</span>
            </Link>
            <p className="text-sm text-[var(--text-subtle)] leading-relaxed max-w-[220px]">
              AI-powered data visualizations from natural language prompts.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)] mb-4">Product</h4>
            <ul className="space-y-2.5">
              <li><Link href="/examples" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-fast">Examples</Link></li>
              <li><Link href="/#pricing" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-fast">Pricing</Link></li>
              <li><Link href="/#how-it-works" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-fast">How It Works</Link></li>
              <li><Link href="/#faq" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-fast">FAQ</Link></li>
              <li><Link href="/blog" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-fast">Blog</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)] mb-4">Account</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/signup" className="text-sm text-[var(--primary)] font-medium hover:text-[var(--primary-hover)] transition-colors duration-fast">
                  Get Started Free →
                </Link>
              </li>
              <li><Link href="/login" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-fast">Sign In</Link></li>
              <li><Link href="/feedback" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-fast">Feedback</Link></li>
            </ul>
          </div>

        </div>

        <div className="mt-10 pt-6 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--text-subtle)]">
            &copy; {CURRENT_YEAR} Prompt2Chart. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
