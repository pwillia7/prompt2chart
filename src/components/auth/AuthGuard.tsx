'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/authStore'
import { Spinner } from '../ui/Spinner'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { session, initialized } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (initialized && !session) {
      router.replace('/login')
    }
  }, [initialized, session, router])

  if (!initialized || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <Spinner size="lg" />
      </div>
    )
  }

  return <>{children}</>
}
