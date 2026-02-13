import { useState, useCallback } from 'react'
import { useDatasetStore } from '../../store/datasetStore'
import { Spinner } from '../ui/Spinner'

interface DatasetUploaderProps {
  projectId: string
  onUploadComplete?: () => void
}

export function DatasetUploader({ projectId, onUploadComplete }: DatasetUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const { uploadDataset, loading, error } = useDatasetStore()

  const handleFile = useCallback(async (file: File) => {
    const validExtensions = ['.csv', '.json']
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))

    if (!validExtensions.includes(ext)) {
      alert('Please upload a CSV or JSON file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    const result = await uploadDataset(projectId, file)
    if (result && onUploadComplete) {
      onUploadComplete()
    }
  }, [projectId, uploadDataset, onUploadComplete])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-card p-8 text-center transition-all duration-fast
          ${isDragging ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border-strong)] hover:border-[var(--text-subtle)]'}
          ${loading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Spinner />
            <p className="text-[var(--text-muted)]">Uploading and analyzing...</p>
          </div>
        ) : (
          <>
            <svg className="mx-auto h-12 w-12 text-[var(--text-subtle)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-[var(--text-muted)]">
              Drag and drop your data file here, or
            </p>
            <label className="mt-2 inline-block cursor-pointer">
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleInputChange}
                className="hidden"
              />
              <span className="inline-flex items-center justify-center font-medium rounded-[10px] transition-all duration-fast bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border-strong)] hover:bg-[var(--surface-3)] px-3 py-1.5 text-sm">
                Browse Files
              </span>
            </label>
            <p className="mt-2 text-sm text-[var(--text-subtle)]">
              Supports CSV and JSON (max 10MB)
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-card text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
