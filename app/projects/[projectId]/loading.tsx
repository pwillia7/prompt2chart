// Route-level Suspense fallback: instant navigation feedback + the boundary
// cacheComponents needs so the project's dynamic data streams in.
export default function Loading() {
  return (
    <div>
      <div className="h-16 border-b border-[var(--border)]" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-5 w-32 rounded bg-[var(--surface-2)] animate-pulse mb-4" />
        <div className="h-8 w-64 rounded bg-[var(--surface-2)] animate-pulse mb-6" />
        <div className="flex gap-2 border-b border-[var(--border)] mb-6">
          <div className="h-9 w-20 rounded-t bg-[var(--surface-2)] animate-pulse" />
          <div className="h-9 w-24 rounded-t bg-[var(--surface-1)] animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-card border border-[var(--border)] bg-[var(--surface-1)] animate-pulse" />
          <div className="h-64 rounded-card border border-[var(--border)] bg-[var(--surface-1)] animate-pulse" />
        </div>
      </div>
    </div>
  )
}
