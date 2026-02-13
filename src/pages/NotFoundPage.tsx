import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="max-w-md w-full text-center">
        <p className="text-6xl font-bold text-[var(--surface-3)] mb-2">404</p>
        <h1 className="text-xl font-semibold text-[var(--text)] mb-2">Page not found</h1>
        <p className="text-[var(--text-muted)] mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex px-4 py-2 bg-[var(--primary)] text-white rounded-[10px] text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors duration-fast"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
