import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { ProjectList } from '../components/projects/ProjectList'
import { CreateProjectModal } from '../components/projects/CreateProjectModal'
import { Button } from '../components/ui/Button'
import { useBillingStore } from '../store/billingStore'

export function DashboardPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const { fetchCredits } = useBillingStore()

  useEffect(() => {
    const checkout = searchParams.get('checkout')
    if (checkout === 'success') {
      setCheckoutMessage('Payment successful! Your credits have been added.')
      fetchCredits()
      setSearchParams({}, { replace: true })
    } else if (checkout === 'cancelled') {
      setCheckoutMessage('Checkout was cancelled.')
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams, fetchCredits])

  return (
    <Layout>
      {checkoutMessage && (
        <div className={`mb-6 p-4 rounded-lg border text-sm ${
          checkoutMessage.includes('successful')
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-gray-50 border-gray-200 text-gray-700'
        }`}>
          {checkoutMessage}
          <button
            onClick={() => setCheckoutMessage(null)}
            className="ml-3 text-xs underline opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Projects</h1>
          <p className="text-gray-600 mt-1">
            Create and manage your visualization projects
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </Button>
      </div>

      <ProjectList />

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </Layout>
  )
}
