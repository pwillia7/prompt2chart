import { createSupabaseServerClient } from '@/lib/supabase-server'

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

// Authenticate the caller from the cookie session (same-origin fetch carries
// the @supabase/ssr session cookies). Throws AuthError if not signed in.
export async function requireUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new AuthError('Invalid or expired session', 401)
  }
  return user
}
