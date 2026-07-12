// Route-level Suspense fallback: gives instant navigation feedback and provides
// the boundary cacheComponents needs so the page's dynamic data (cookies,
// searchParams, cached fetch) streams in rather than blocking the shell.
export default function Loading() {
  return (
    <div>
      {/* header placeholder */}
      <div className="h-16 border-b border-[var(--border)]" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="space-y-2">
            <div className="h-7 w-48 rounded bg-[var(--surface-2)] animate-pulse" />
            <div className="h-4 w-64 rounded bg-[var(--surface-2)] animate-pulse" />
          </div>
          <div className="h-10 w-36 rounded-card bg-[var(--surface-2)] animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-card border border-[var(--border)] bg-[var(--surface-1)] animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
