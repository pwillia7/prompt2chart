import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const { resetPassword, loading } = useAuthStore()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const { error } = await resetPassword(email)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mb-4 p-4 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-card">
          <p className="text-green-400">
            If an account exists with that email, you'll receive a password reset link shortly.
          </p>
        </div>
        <Link
          to="/login"
          className="text-[var(--primary)] hover:text-primary-400 font-medium text-sm"
        >
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-[10px] text-red-400 text-sm">
          {error}
        </div>
      )}

      <p className="text-sm text-[var(--text-muted)]">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />

      <Button type="submit" className="w-full" loading={loading}>
        Send Reset Link
      </Button>

      <p className="text-center text-sm text-[var(--text-muted)]">
        <Link to="/login" className="text-[var(--primary)] hover:text-primary-400 font-medium">
          Back to login
        </Link>
      </p>
    </form>
  )
}
