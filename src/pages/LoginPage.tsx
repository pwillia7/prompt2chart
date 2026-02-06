import { Navigate } from 'react-router-dom'
import { LoginForm } from '../components/auth/LoginForm'
import { useAuthStore } from '../store/authStore'

export function LoginPage() {
  const { user } = useAuthStore()

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <svg className="mx-auto w-16 h-16" viewBox="0 0 100 100">
            <rect x="10" y="60" width="15" height="30" fill="#0ea5e9"/>
            <rect x="30" y="40" width="15" height="50" fill="#38bdf8"/>
            <rect x="50" y="20" width="15" height="70" fill="#0284c7"/>
            <rect x="70" y="35" width="15" height="55" fill="#7dd3fc"/>
          </svg>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to Prompt2Chart
          </p>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
