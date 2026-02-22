import { useRef, useState, useCallback, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { track } from '../lib/analytics'
import { exampleCharts } from '../data/exampleCharts'
import { D3ChartRenderer } from '../components/charts/D3ChartRenderer'
import { ChartRenderer } from '../components/charts/ChartRenderer'
import { VegaLiteSpec } from '../types'

export function LandingPage() {
  const { session } = useAuthStore()
  useDocumentTitle('Prompt2Chart - AI-Powered Data Visualizations')

  if (session) {
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
          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="#pricing"
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-fast hidden sm:inline"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-fast hidden sm:inline"
            >
              FAQ
            </a>
            <Link
              to="/examples"
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-fast hidden sm:inline"
            >
              Examples
            </Link>
            <Link
              to="/login"
              onClick={() => track('signin-clicked')}
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
              onClick={() => track('cta-hero-clicked')}
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

        </div>

        <ExamplesCarousel />
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

      {/* Pricing */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-dashed border-[var(--border-strong)]" />
      </div>
      <section id="pricing" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[var(--text)]">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-[var(--text-muted)]">
              No subscriptions. No hidden fees. Start free and only pay for what you need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free tier */}
            <div className="bg-[var(--surface-2)] rounded-card p-6 border-2 border-[var(--primary)] relative">
              <div className="absolute -top-3 left-6 px-3 py-0.5 bg-[var(--primary)] text-white text-xs font-medium rounded-full">
                Free to start
              </div>
              <h3 className="text-lg font-semibold text-[var(--text)] mb-4 mt-1">What's included</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-[var(--text-muted)]">
                  <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong className="text-[var(--text)]">100 credits</strong> when you sign up</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-[var(--text-muted)]">
                  <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong className="text-[var(--text)]">25 free credits</strong> added every month</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-[var(--text-muted)]">
                  <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong className="text-[var(--text)]">Unlimited</strong> dataset uploads, projects, and exports</span>
                </li>
              </ul>
            </div>

            {/* Credit costs */}
            <div className="bg-[var(--surface-2)] rounded-card p-6 border border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--text)] mb-4">What costs a credit</h3>
              <ul className="space-y-3">
                <li className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Chart generation</span>
                  <span className="font-medium text-[var(--text)]">1 credit</span>
                </li>
                <li className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Analyst chat message</span>
                  <span className="font-medium text-[var(--text)]">1 credit</span>
                </li>
                <li className="border-t border-[var(--border)] pt-3 mt-3">
                  <p className="text-xs font-medium text-[var(--text-subtle)] uppercase tracking-wider mb-2">Always free</p>
                  <p className="text-sm text-[var(--text-muted)]">Dataset uploads, browsing, PNG/SVG/HTML exports</p>
                </li>
              </ul>
              <p className="mt-4 text-xs text-[var(--text-subtle)]">
                Need more? Credit packs available for purchase after signup.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-dashed border-[var(--border-strong)]" />
      </div>
      <section id="faq" className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[var(--text)]">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-4">
            <FaqCard
              question="What if I run out of credits?"
              answer="You get 25 free credits every month, automatically. If you need more, you can buy credit packs anytime — no commitment, no subscription."
            />
            <FaqCard
              question="Is my data secure?"
              answer="Your data is stored privately and is never shared with other users or used for model training. Only you can access your datasets and charts."
            />
            <FaqCard
              question="Do I need a subscription?"
              answer="No. Prompt2Chart has no subscriptions. You get free monthly credits, and you can optionally purchase more whenever you need them."
            />
            <FaqCard
              question="What data formats are supported?"
              answer="You can upload CSV files or paste data directly. Prompt2Chart automatically detects column names, types, and data patterns."
            />
            <FaqCard
              question="Can I export my charts?"
              answer="Yes — every chart can be exported as PNG, SVG, or standalone HTML. Exports are always free and don't cost any credits."
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
            100 free credits included. No credit card required.
          </p>
          <Link
            to="/signup"
            onClick={() => track('cta-bottom-clicked')}
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

function FaqCard({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="bg-[var(--surface-2)] rounded-card p-5 border border-[var(--border)]">
      <h3 className="text-sm font-semibold text-[var(--text)] mb-2">{question}</h3>
      <p className="text-sm text-[var(--text-muted)] leading-relaxed">{answer}</p>
    </div>
  )
}

function ExamplesCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const autoAdvanceInterval = 6000
  const carouselIds = [
    'revenue-scatter', 'traffic-line', 'salary-beeswarm', 'budget-donut',
    'music-stream', 'phone-treemap', 'energy-sankey', 'trade-chord',
    'gdp-scatter', 'revenue-area',
  ]
  const sorted = carouselIds.map(id => exampleCharts.find(c => c.id === id)!)

  const scrollToIndex = useCallback((idx: number) => {
    const el = scrollRef.current
    if (!el) return
    const card = el.querySelector(`[data-index="${idx}"]`) as HTMLElement | null
    if (!card) return
    const scrollLeft = card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2
    el.scrollTo({ left: scrollLeft, behavior: 'smooth' })
  }, [])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const center = el.scrollLeft + el.clientWidth / 2
    const cards = el.querySelectorAll<HTMLElement>('[data-index]')
    let closestIdx = 0
    let minDist = Infinity
    cards.forEach(card => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2
      const dist = Math.abs(cardCenter - center)
      if (dist < minDist) {
        minDist = dist
        closestIdx = parseInt(card.dataset.index!, 10)
      }
    })
    setActiveIndex(closestIdx)
  }, [])

  const goTo = useCallback((idx: number) => {
    const wrapped = ((idx % sorted.length) + sorted.length) % sorted.length
    scrollToIndex(wrapped)
  }, [scrollToIndex])

  // Auto-advance with wraparound, paused on hover
  useEffect(() => {
    if (isHovered) return
    const timer = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % sorted.length
        scrollToIndex(next)
        return next
      })
    }, autoAdvanceInterval)
    return () => clearInterval(timer)
  }, [isHovered, scrollToIndex])

  return (
    <div
      className="mt-16"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Centered heading */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
        <h3 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">
          Example Outputs
        </h3>
        <p className="mt-3 text-base text-[var(--text-muted)]">
          Every visualization below was generated from a single prompt.{' '}
          <Link to="/examples" className="text-[var(--primary)] font-medium hover:underline">
            View all examples →
          </Link>
        </p>
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Left arrow — always visible, wraps around */}
        <button
          onClick={() => goTo(activeIndex - 1)}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg border border-gray-200 flex items-center justify-center hover:bg-white hover:scale-105 transition-all"
          aria-label="Previous chart"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Right arrow — always visible, wraps around */}
        <button
          onClick={() => goTo(activeIndex + 1)}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg border border-gray-200 flex items-center justify-center hover:bg-white hover:scale-105 transition-all"
          aria-label="Next chart"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Scrollable track — single card visible */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="carousel-scroll flex gap-6 overflow-x-auto px-12 sm:px-16"
          style={{
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
          } as React.CSSProperties}
        >
          {/* Spacer to allow first card to center */}
          <div className="shrink-0" style={{ width: 'max(0px, calc(50% - 370px))' }} aria-hidden="true" />

          {sorted.map((example, i) => (
            <div
              key={example.id}
              data-index={i}
              className="w-[85vw] max-w-[700px] shrink-0 bg-white rounded-card shadow-soft overflow-hidden border border-[var(--border)] flex flex-col"
              style={{ scrollSnapAlign: 'center' }}
            >
              {/* Card header: sets context before the chart renders */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--surface-1)] border-b border-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)] truncate">{example.title}</p>
                <span className={`ml-3 shrink-0 px-2 py-0.5 text-[10px] rounded-full font-medium ${
                  example.library === 'd3'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {example.library === 'd3' ? 'D3.js' : 'Vega-Lite'}
                </span>
              </div>

              <div className="overflow-hidden bg-white">
                {example.library === 'd3' ? (
                  <D3ChartRenderer code={example.d3Code!} data={example.data as unknown[]} />
                ) : (
                  <ChartRenderer spec={example.vegaSpec as VegaLiteSpec} />
                )}
              </div>

              {/* Prompt footer: the "aha" moment */}
              <div className="px-4 py-3 border-t border-[var(--border)] bg-orange-50">
                <div className="flex items-center gap-1.5 mb-1">
                  <svg className="w-3.5 h-3.5 text-orange-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-500">Prompt</span>
                </div>
                <p className="text-sm text-[var(--text)] leading-snug line-clamp-2">
                  &ldquo;{example.description}&rdquo;
                </p>
              </div>
            </div>
          ))}

          {/* Spacer to allow last card to center */}
          <div className="shrink-0" style={{ width: 'max(0px, calc(50% - 370px))' }} aria-hidden="true" />
        </div>

        <style>{`.carousel-scroll::-webkit-scrollbar { display: none; }`}</style>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-5">
        {sorted.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-200 ${
              i === activeIndex
                ? 'w-6 h-2 bg-[var(--primary)]'
                : 'w-2 h-2 bg-[var(--border-strong)] hover:bg-[var(--text-subtle)]'
            }`}
            aria-label={`Go to example ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

