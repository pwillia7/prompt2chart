import { Navigate } from 'react-router-dom'
import { LoginForm } from '../components/auth/LoginForm'
import { useAuthStore } from '../store/authStore'

export function LoginPage() {
  const { user } = useAuthStore()

  if (user) {
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
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Sign in to Prompt2Chart
          </p>
        </div>
        <div className="bg-[var(--surface-1)] p-8 rounded-card shadow-soft border border-[var(--border)]">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
