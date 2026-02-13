import { useState, FormEvent, KeyboardEvent } from 'react'
import { Button } from '../ui/Button'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit(e as unknown as FormEvent)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || loading}
        rows={3}
        className="w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-card
          text-[var(--text)] placeholder:text-[var(--text-subtle)] font-mono text-sm
          focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--primary)]
          disabled:opacity-50 disabled:cursor-not-allowed resize-none
          transition-all duration-fast"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-subtle)]">{isMac ? '\u2318' : 'Ctrl+'}Enter to submit</span>
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
