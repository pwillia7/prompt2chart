import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { SocialLoginButtons } from './SocialLoginButtons'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { signUp, loading } = useAuthStore()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    const { error } = await signUp(email, password)
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mb-4 p-4 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-card">
          <p className="text-green-400">
            Account created! Please check your email to confirm your account.
          </p>
        </div>
        <Link
          to="/login"
          className="text-[var(--primary)] hover:text-primary-400 font-medium"
        >
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <SocialLoginButtons />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border-strong)]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-[var(--surface-1)] text-[var(--text-subtle)]">or</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-[10px] text-red-400 text-sm">
            {error}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />

        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
        />

        <Button type="submit" className="w-full" loading={loading}>
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--text-muted)]">
        Already have an account?{' '}
        <Link to="/login" className="text-[var(--primary)] hover:text-primary-400 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
