import { AuthError } from './auth'
import { InsufficientCreditsError } from './credits'

// Maps thrown errors to the same JSON responses the Supabase edge functions used.
export function handleRouteError(error: unknown): Response {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status })
  }
  if (error instanceof InsufficientCreditsError) {
    return Response.json(
      { error: error.message, creditsRemaining: error.remaining },
      { status: 402 },
    )
  }
  console.error('Route error:', error)
  const message = error instanceof Error ? error.message : 'Internal error'
  return Response.json({ error: message }, { status: 500 })
}
