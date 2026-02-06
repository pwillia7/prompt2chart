import { useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { ProjectList } from '../components/projects/ProjectList'
import { CreateProjectModal } from '../components/projects/CreateProjectModal'
import { Button } from '../components/ui/Button'

export function DashboardPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  return (
    <Layout>
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
