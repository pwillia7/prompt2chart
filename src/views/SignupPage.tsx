import { Navigate } from '@/lib/router-compat'
import { SignupForm } from '../components/auth/SignupForm'
import { useAuthStore } from '../store/authStore'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function SignupPage() {
  const { session } = useAuthStore()
  useDocumentTitle('Sign Up - Prompt2Chart')

  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <svg className="mx-auto w-14 h-14" viewBox="0 0 100 100">
            <rect x="10" y="60" width="15" height="30" fill="#FDBA74" />
            <rect x="30" y="40" width="15" height="50" fill="#FB923C" />
            <rect x="50" y="20" width="15" height="70" fill="#F97316" />
            <rect x="70" y="35" width="15" height="55" fill="#EA580C" />
          </svg>
          <h2 className="mt-6 text-3xl font-bold text-[var(--text)]">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Upload your own data, or start with a sample dataset.
          </p>
          <p className="mt-3 text-sm font-medium text-[var(--primary)]">
            100 free charts included · No credit card required
          </p>
        </div>
        <div className="bg-[var(--surface-1)] p-8 rounded-card shadow-soft border border-[var(--border)]">
          <SignupForm />
        </div>
      </div>
    </div>
  )
}
