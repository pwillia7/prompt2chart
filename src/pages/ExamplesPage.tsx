import { useState } from 'react'
import { Link } from 'react-router-dom'
import { D3ChartRenderer } from '../components/charts/D3ChartRenderer'
import { ChartRenderer } from '../components/charts/ChartRenderer'
import { exampleCharts, ChartExample } from '../data/exampleCharts'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import { VegaLiteSpec } from '../types'

type Filter = 'all' | 'd3' | 'vega-lite'

export function ExamplesPage() {
  useDocumentTitle('Examples Gallery - Prompt2Chart')
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = filter === 'all'
    ? exampleCharts
    : exampleCharts.filter(c => c.library === filter)

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
              to="/examples"
              className="text-sm font-medium text-[var(--text)] transition-colors duration-fast hidden sm:inline"
            >
              Examples
            </Link>
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
      <section className="py-14 sm:py-18">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text)]">
            Examples Gallery
          </h1>
          <p className="mt-4 text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            See what's possible. From simple bar charts to interactive network diagrams,
            every visualization below was generated from a single prompt.
          </p>
        </div>
      </section>

      {/* Filter tabs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex gap-2">
          <FilterTab label="All" count={exampleCharts.length} active={filter === 'all'} onClick={() => setFilter('all')} />
          <FilterTab label="D3.js" count={exampleCharts.filter(c => c.library === 'd3').length} active={filter === 'd3'} onClick={() => setFilter('d3')} />
          <FilterTab label="Vega-Lite" count={exampleCharts.filter(c => c.library === 'vega-lite').length} active={filter === 'vega-lite'} onClick={() => setFilter('vega-lite')} />
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid md:grid-cols-2 gap-8">
          {filtered.map(example => (
            <ExampleCard key={example.id} example={example} />
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <section className="py-20 bg-[var(--primary)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Create your own charts
          </h2>
          <p className="mt-4 text-lg text-white/70">
            Describe what you want in plain English. AI builds it in seconds.
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

function FilterTab({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-[10px] transition-colors duration-fast ${
        active
          ? 'bg-[var(--primary)] text-white'
          : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:bg-[var(--surface-3)]'
      }`}
    >
      {label} <span className={active ? 'text-white/70' : 'text-[var(--text-subtle)]'}>({count})</span>
    </button>
  )
}

function ExampleCard({ example }: { example: ChartExample }) {
  return (
    <div className="bg-[var(--surface-2)] rounded-card border border-[var(--border)] overflow-hidden">
      <div className="bg-white">
        {example.library === 'd3' ? (
          <D3ChartRenderer code={example.d3Code!} data={example.data as unknown[]} />
        ) : (
          <ChartRenderer spec={example.vegaSpec as VegaLiteSpec} />
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h3 className="text-base font-semibold text-[var(--text)]">{example.title}</h3>
          <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--surface-3)] text-[var(--text-muted)]">
            {example.chartType}
          </span>
          <span className={`px-2 py-0.5 text-xs rounded-full ${
            example.library === 'd3'
              ? 'bg-orange-100 text-orange-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {example.library === 'd3' ? 'D3.js' : 'Vega-Lite'}
          </span>
        </div>
        <p className="text-sm text-[var(--text-muted)] italic">
          &ldquo;{example.description}&rdquo;
        </p>
      </div>
    </div>
  )
}
