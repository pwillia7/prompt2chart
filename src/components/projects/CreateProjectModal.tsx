import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../../store/projectStore'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const { createProject, loading } = useProjectStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const project = await createProject(name.trim())
    if (project) {
      setName('')
      onClose()
      navigate(`/projects/${project.id}`)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Visualization Project"
          autoFocus
          required
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!name.trim()}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  )
}
