import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SAMPLE_DATASETS, loadSampleDataset, SampleDataset } from '../../lib/sampleData'
import { useProjectStore } from '../../store/projectStore'
import { useDatasetStore } from '../../store/datasetStore'
import { track } from '../../lib/analytics'

export function SampleDataCards() {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { createProject } = useProjectStore()
  const { uploadDataset } = useDatasetStore()

  const handleClick = async (sample: SampleDataset) => {
    if (loadingId) return
    setLoadingId(sample.id)
    setError(null)

    try {
      track('sample-data-selected', { dataset: sample.id })
      const { projectId } = await loadSampleDataset(sample, createProject, uploadDataset)
      router.push(`/projects/${projectId}`)
    } catch (err) {
      setError((err as Error).message || 'Something went wrong. Please try again.')
      setLoadingId(null)
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SAMPLE_DATASETS.map((sample) => {
          const isLoading = loadingId === sample.id
          const isDimmed = loadingId !== null && !isLoading

          return (
            <button
              key={sample.id}
              onClick={() => handleClick(sample)}
              disabled={loadingId !== null}
              className={`text-left p-4 rounded-card border border-[var(--border)] bg-[var(--surface-1)] transition-all ${
                isDimmed ? 'opacity-40 cursor-not-allowed' : ''
              } ${!loadingId ? 'hover:border-[var(--primary)] hover:bg-[var(--surface-2)] cursor-pointer' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-[var(--text)]">{sample.name}</h3>
                <span className="text-xs text-[var(--text-muted)]">
                  {sample.rowCount.toLocaleString()} rows
                </span>
              </div>
              <p className="text-sm text-[var(--text-muted)]">{sample.description}</p>
              {isLoading && (
                <div className="mt-3 flex items-center gap-2 text-sm text-[var(--primary)]">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Setting up project...
                </div>
              )}
            </button>
          )
        })}
      </div>
      {error && (
        <p className="mt-3 text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
