import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { AuthGuard } from './components/auth/AuthGuard'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoginPage } from './views/LoginPage'
import { SignupPage } from './views/SignupPage'
import { DashboardPage } from './views/DashboardPage'
import { ProjectPage } from './views/ProjectPage'
import { ForgotPasswordPage } from './views/ForgotPasswordPage'
import { LandingPage } from './views/LandingPage'
import { ExamplesPage } from './views/ExamplesPage'
import { FeedbackPage } from './views/FeedbackPage'
import { PricingPage } from './views/PricingPage'
import { NotFoundPage } from './views/NotFoundPage'
import { BlogIndexPage } from './views/BlogIndexPage'
import { BlogPostPage } from './views/BlogPostPage'
import { SharedChartPage } from './views/SharedChartPage'
import { Spinner } from './components/ui/Spinner'

function App() {
  const { initialize, initialized } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/examples" element={<ExamplesPage />} />
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <DashboardPage />
            </AuthGuard>
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <AuthGuard>
              <ProjectPage />
            </AuthGuard>
          }
        />
        <Route
          path="/pricing"
          element={
            <AuthGuard>
              <PricingPage />
            </AuthGuard>
          }
        />
        <Route
          path="/feedback"
          element={
            <AuthGuard>
              <FeedbackPage />
            </AuthGuard>
          }
        />
        <Route path="/blog" element={<BlogIndexPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/share/:shareId" element={<SharedChartPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
