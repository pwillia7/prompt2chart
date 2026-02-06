import { useState, FormEvent } from 'react'
import { Button } from '../ui/Button'

interface ChartPromptInputProps {
  onSubmit: (prompt: string) => void
  loading?: boolean
  placeholder?: string
  submitLabel?: string
  disabled?: boolean
}

export function ChartPromptInput({
  onSubmit,
  loading = false,
  placeholder = 'Describe the chart you want to create...',
  submitLabel = 'Generate Chart',
  disabled = false,
}: ChartPromptInputProps) {
  const [prompt, setPrompt] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || loading || disabled) return
    onSubmit(prompt.trim())
    setPrompt('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || loading}
        rows={3}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          loading={loading}
          disabled={!prompt.trim() || disabled}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
