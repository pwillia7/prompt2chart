import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'
import { CreditsDisplay } from '../billing/CreditsDisplay'
import { UpgradeModal } from '../billing/UpgradeModal'

export function Header() {
  const { user, signOut, loading } = useAuthStore()
  const [showUpgrade, setShowUpgrade] = useState(false)

  return (
    <>
      <header className="border-b border-[var(--border)] bg-[var(--surface-1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <svg className="w-7 h-7" viewBox="0 0 100 100">
                <rect x="10" y="60" width="15" height="30" fill="#818cf8" />
                <rect x="30" y="40" width="15" height="50" fill="#6366f1" />
                <rect x="50" y="20" width="15" height="70" fill="#4F46E5" />
                <rect x="70" y="35" width="15" height="55" fill="#a78bfa" />
              </svg>
              <span className="text-lg font-semibold text-[var(--text)]">Prompt2Chart</span>
            </Link>

            {user && (
              <div className="flex items-center gap-3">
                <CreditsDisplay onUpgrade={() => setShowUpgrade(true)} />
                <span className="text-sm text-[var(--text-subtle)]">{user.email}</span>
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

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  )
}
