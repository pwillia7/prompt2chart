'use client'

import { DashboardPage } from '@/views/DashboardPage'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function Page() {
  return (
    <AuthGuard>
      <DashboardPage />
    </AuthGuard>
  )
}
