'use client'

import { FeedbackPage } from '@/views/FeedbackPage'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function Page() {
  return (
    <AuthGuard>
      <FeedbackPage />
    </AuthGuard>
  )
}
