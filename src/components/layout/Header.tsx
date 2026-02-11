import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'

export function Header() {
  const { user, signOut, loading } = useAuthStore()

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="flex items-center gap-2">
            <svg className="w-8 h-8" viewBox="0 0 100 100">
              <rect x="10" y="60" width="15" height="30" fill="#0ea5e9"/>
              <rect x="30" y="40" width="15" height="50" fill="#38bdf8"/>
              <rect x="50" y="20" width="15" height="70" fill="#0284c7"/>
              <rect x="70" y="35" width="15" height="55" fill="#7dd3fc"/>
            </svg>
            <span className="text-xl font-bold text-gray-900">Prompt2Chart</span>
          </Link>

          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                loading={loading}
              >
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
