// Suspense boundary for the dynamic (runtime params) share route, so the shared
// chart streams in rather than blocking the whole page.
export default function Loading() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="h-16 border-b border-[var(--border)]" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-8 w-2/3 rounded bg-[var(--surface-2)] animate-pulse mb-6" />
        <div className="h-[450px] rounded-card border border-[var(--border)] bg-[var(--surface-1)] animate-pulse" />
      </div>
    </div>
  )
}
