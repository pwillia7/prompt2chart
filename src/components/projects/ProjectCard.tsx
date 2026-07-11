import { useState } from 'react'
import Link from 'next/link'
import { Project } from '../../types'
import { useProjectStore } from '../../store/projectStore'
import { Button } from '../ui/Button'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { deleteProject } = useProjectStore()

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return
    setIsDeleting(true)
    await deleteProject(project.id)
    setIsDeleting(false)
  }

  const formattedDate = new Date(project.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="bg-[var(--surface-1)] rounded-card border border-[var(--border)] p-6 hover:border-[var(--border-strong)] hover:shadow-soft transition-all duration-normal">
      <div className="flex justify-between items-start">
        <Link href={`/projects/${project.id}`} className="flex-1">
          <h3 className="text-base font-semibold text-[var(--text)] hover:text-[var(--primary)] transition-colors duration-fast">
            {project.name}
          </h3>
          <p className="text-sm text-[var(--text-subtle)] mt-1">
            Created {formattedDate}
          </p>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          loading={isDeleting}
          className="text-[var(--text-subtle)] hover:text-[var(--danger)]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </Button>
      </div>
    </div>
  )
}
