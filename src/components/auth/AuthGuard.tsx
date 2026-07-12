'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/authStore'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { session, initialized } = useAuthStore()
  const router = useRouter()

  // The server already gates these routes (page.tsx does getUser() + redirect),
  // so render immediately for fast LCP. Only redirect if the client later
  // confirms the session is gone (e.g. it expired mid-session).
  useEffect(() => {
    if (initialized && !session) {
      router.replace('/login')
    }
  }, [initialized, session, router])

  return <>{children}</>
}
