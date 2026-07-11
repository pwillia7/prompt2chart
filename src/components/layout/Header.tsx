import { useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'
import { CreditsDisplay } from '../billing/CreditsDisplay'
import { UpgradeModal } from '../billing/UpgradeModal'
import { getTheme, toggleTheme } from '../../lib/theme'

export function Header() {
  const { user, signOut, loading } = useAuthStore()
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [isDark, setIsDark] = useState(() => getTheme() === 'dark')

  const handleToggleTheme = () => {
    const next = toggleTheme()
    setIsDark(next === 'dark')
  }

  return (
    <>
      <header className="border-b border-[var(--border)] bg-[var(--surface-1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <svg className="w-7 h-7" viewBox="0 0 100 100">
                <rect x="10" y="60" width="15" height="30" fill="#FDBA74" />
                <rect x="30" y="40" width="15" height="50" fill="#FB923C" />
                <rect x="50" y="20" width="15" height="70" fill="#F97316" />
                <rect x="70" y="35" width="15" height="55" fill="#EA580C" />
              </svg>
              <span className="text-lg font-semibold text-[var(--text)]">Prompt2Chart</span>
            </Link>

            <div className="flex items-center gap-3">
              {user && (
                <>
                  <CreditsDisplay onUpgrade={() => setShowUpgrade(true)} />
                  <span className="text-sm text-[var(--text-subtle)]">{user.email}</span>
                </>
              )}
              <button
                onClick={handleToggleTheme}
                className="p-2 rounded-input text-[var(--text-subtle)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors duration-fast"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  loading={loading}
                >
                  Sign Out
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  )
}
