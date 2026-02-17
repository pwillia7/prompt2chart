import { Link } from 'react-router-dom'
import { SocialLoginButtons } from './SocialLoginButtons'

export function LoginForm() {
  return (
    <div className="space-y-4">
      <SocialLoginButtons />

      <p className="text-center text-sm text-[var(--text-muted)]">
        Don't have an account?{' '}
        <Link to="/signup" className="text-[var(--primary)] hover:text-primary-400 font-medium">
          Sign up
        </Link>
      </p>
    </div>
  )
}
