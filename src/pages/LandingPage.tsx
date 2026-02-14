import { Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function LandingPage() {
  const { user } = useAuthStore()

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Nav */}
      <nav className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg className="w-7 h-7" viewBox="0 0 100 100">
              <rect x="10" y="60" width="15" height="30" fill="#FDBA74" />
              <rect x="30" y="40" width="15" height="50" fill="#FB923C" />
              <rect x="50" y="20" width="15" height="70" fill="#F97316" />
              <rect x="70" y="35" width="15" height="55" fill="#EA580C" />
            </svg>
            <span className="text-lg font-semibold text-[var(--text)]">Prompt2Chart</span>
          </div>
          <div className="flex items-center gap-3">
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

      {/* Hero */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--text)] leading-tight">
            Turn your data into
            <span className="text-[var(--primary)]"> beautiful charts</span> with AI
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-[var(--text-muted)] max-w-2xl mx-auto">
            Describe what you want in plain English. Prompt2Chart uses AI to generate
            interactive, publication-quality visualizations from your data.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="px-8 py-3 bg-[var(--primary)] text-white text-base font-medium rounded-[10px] hover:bg-[var(--primary-hover)] transition-colors duration-fast shadow-soft"
            >
              Get Started Free →
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-3 text-[var(--text-muted)] text-base font-medium rounded-[10px] border border-[var(--border-strong)] hover:bg-[var(--surface-1)] transition-colors duration-fast"
            >
              See How It Works
            </a>
          </div>

          {/* Example prompt */}
          <div className="mt-16 max-w-2xl mx-auto">
            <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-card p-6 text-left">
              <div className="text-xs font-medium text-[var(--text-subtle)] uppercase tracking-wider mb-3">Example prompt</div>
              <p className="text-[var(--text)] text-sm leading-relaxed font-mono">
                "Create an interactive scatter plot of revenue vs customer satisfaction,
                colored by region, with zoom and pan. Add a trend line and tooltips showing
                the company name."
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                AI generates interactive D3.js chart in seconds
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-dashed border-[var(--border-strong)]" />
      </div>
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[var(--text)]">
              Everything you need to visualize your data
            </h2>
            <p className="mt-4 text-lg text-[var(--text-muted)]">
              From simple bar charts to complex interactive dashboards, all from natural language.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              }
              title="Natural Language"
              description="Describe your chart in plain English. No code required — just say what you want to see."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              }
              title="Interactive Charts"
              description="Zoom, pan, brush, filter, and hover. Every chart is fully interactive out of the box."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              }
              title="Export Anywhere"
              description="Download as PNG, SVG, or standalone HTML. Share on CodePen with one click."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              }
              title="AI Analyst"
              description="Get automated insights about your data — patterns, outliers, and suggestions for deeper analysis."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }
              title="Iterate & Refine"
              description="Edit any chart with follow-up prompts. Add features, change colors, tweak layouts — just ask."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              }
              title="D3.js & Vega-Lite"
              description="Two powerful engines. D3 for fully custom interactive charts, Vega-Lite for quick declarative specs."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-dashed border-[var(--border-strong)]" />
      </div>
      <section id="how-it-works" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[var(--text)]">
              How it works
            </h2>
            <p className="mt-4 text-lg text-[var(--text-muted)]">
              Three steps from raw data to polished visualization.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <StepCard
              number="1"
              title="Upload your data"
              description="Drop a CSV or paste data directly. Prompt2Chart automatically detects columns, types, and patterns."
            />
            <StepCard
              number="2"
              title="Describe your chart"
              description="Tell the AI what you want to visualize in plain English. It generates interactive D3.js or Vega-Lite code."
            />
            <StepCard
              number="3"
              title="Export & share"
              description="Download as PNG, SVG, or HTML. Open in CodePen. Iterate with follow-up prompts until it's perfect."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[var(--primary)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to start visualizing?
          </h2>
          <p className="mt-4 text-lg text-white/70">
            Sign up for free and create your first chart in under a minute.
          </p>
          <Link
            to="/signup"
            className="mt-8 inline-block px-8 py-3 bg-white text-[var(--primary)] text-base font-medium rounded-[10px] hover:bg-white/90 transition-colors duration-fast shadow-soft"
          >
            Get Started Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[var(--surface-1)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-[var(--surface-2)] rounded-card p-6 border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors duration-normal">
      <div className="w-10 h-10 bg-[var(--surface-3)] rounded-[10px] flex items-center justify-center text-[var(--text-muted)] mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-[var(--text)] mb-2">{title}</h3>
      <p className="text-[var(--text-muted)] text-sm leading-relaxed">{description}</p>
    </div>
  )
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto w-12 h-12 bg-[var(--primary)] rounded-full flex items-center justify-center text-white text-xl font-bold mb-4">
        {number}
      </div>
      <h3 className="text-base font-semibold text-[var(--text)] mb-2">{title}</h3>
      <p className="text-[var(--text-muted)] text-sm leading-relaxed">{description}</p>
    </div>
  )
}
