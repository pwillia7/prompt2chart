'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export function Providers({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize)

  // Initialize the auth session in the background. Do NOT block rendering on it:
  // the prerendered/SSR content must paint immediately (LCP). Auth state fills in
  // once getSession resolves; authed routes are already gated server-side.
  useEffect(() => {
    initialize()
  }, [initialize])

  return <ErrorBoundary>{children}</ErrorBoundary>
}
