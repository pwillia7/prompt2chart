'use client'

import { PricingPage } from '@/views/PricingPage'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function Page() {
  return (
    <AuthGuard>
      <PricingPage />
    </AuthGuard>
  )
}
