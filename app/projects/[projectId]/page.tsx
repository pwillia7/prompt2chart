'use client'

import { ProjectPage } from '@/views/ProjectPage'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function Page() {
  return (
    <AuthGuard>
      <ProjectPage />
    </AuthGuard>
  )
}
