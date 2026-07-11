import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { SocialLoginButtons } from './SocialLoginButtons'
import { track } from '../../lib/analytics'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const { signIn, signInWithMagicLink, loading } = useAuthStore()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    track('login-submitted')
    const { error } = await signIn(email, password)
    if (error) {
      setError(error.message)
    }
  }

  const handleMagicLink = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }
    setError('')

    const { error } = await signInWithMagicLink(email)
    if (error) {
      setError(error.message)
    } else {
      track('login-magic-link-sent')
      setMagicLinkSent(true)
    }
  }

  if (magicLinkSent) {
    return (
      <div className="text-center">
        <div className="mb-4 p-4 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-card">
          <p className="text-green-400">
            Check your email for a magic link to sign in.
          </p>
        </div>
        <button
          onClick={() => setMagicLinkSent(false)}
          className="text-[var(--primary)] hover:text-primary-400 text-sm"
        >
          Back to login
        </button>
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
          autoComplete="current-password"
        />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-[var(--primary)] hover:text-primary-400"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          Sign In
        </Button>

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={handleMagicLink}
          loading={loading}
        >
          Send Magic Link
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--text-muted)]">
        Don't have an account?{' '}
        <Link href="/signup" className="text-[var(--primary)] hover:text-primary-400 font-medium">
          Sign up
        </Link>
      </p>
    </div>
  )
}
