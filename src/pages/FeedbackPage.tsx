import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { track } from '../lib/analytics'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function FeedbackPage() {
  useDocumentTitle('Feedback & Support - Prompt2Chart')
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState('feedback')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('https://formsubmit.co/ajax/prompt2chart@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: name || 'Anonymous',
          email: email || 'not provided',
          _subject: `[Prompt2Chart ${category}] from ${name || 'Anonymous'}`,
          category,
          message,
        }),
      })

      if (!res.ok) throw new Error('Failed to send')

      track('feedback-submitted', { category })
      setSubmitted(true)
    } catch {
      setError('Failed to send feedback. Please try emailing prompt2chart@gmail.com directly.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto py-16 text-center">
          <svg className="mx-auto w-12 h-12 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-[var(--text)]">Thanks for your feedback!</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">We'll review your message and get back to you if needed.</p>
          <Button variant="secondary" className="mt-6" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-[var(--text-muted)] hover:text-[var(--text)] mb-6 transition-colors duration-fast"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Feedback & Support</h1>
        <p className="text-sm text-[var(--text-muted)] mb-8">
          Found a bug? Have a feature idea? Let us know and we'll get back to you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Name (optional)</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Email (optional)</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Category</label>
            <div className="flex gap-2">
              {(['feedback', 'bug', 'feature'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-[10px] border transition-colors duration-fast ${
                    category === cat
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'border-[var(--border-strong)] text-[var(--text-muted)] hover:border-[var(--text-subtle)]'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your feedback, bug, or feature request..."
              rows={5}
              required
              className="w-full px-3 py-2 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-input text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--primary)] text-sm resize-y"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <Button type="submit" disabled={submitting || !message.trim()}>
            {submitting ? 'Sending...' : 'Send Feedback'}
          </Button>
        </form>
      </div>
    </Layout>
  )
}
