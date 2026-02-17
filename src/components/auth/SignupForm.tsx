import { Link } from 'react-router-dom'
import { SocialLoginButtons } from './SocialLoginButtons'

export function SignupForm() {
  return (
    <div className="space-y-4">
      <SocialLoginButtons />

      <p className="text-center text-sm text-[var(--text-muted)]">
        Already have an account?{' '}
        <Link to="/login" className="text-[var(--primary)] hover:text-primary-400 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
