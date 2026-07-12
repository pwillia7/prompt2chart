import { requireUser } from '@/lib/server/auth'
import { getCredits, grantMonthlyCredits, CREDIT_PACKS } from '@/lib/server/credits'
import { handleRouteError } from '@/lib/server/respond'

export const maxDuration = 15

// POST (not GET) so cacheComponents never tries to prerender it — the handler
// reads cookies (auth) and lazily grants monthly credits (a mutation).
export async function POST() {
  try {
    const user = await requireUser()
    // Lazily grant monthly free credits if eligible (non-blocking).
    await grantMonthlyCredits(user.id)
    const balance = await getCredits(user.id)
    return Response.json({ balance, packs: CREDIT_PACKS })
  } catch (error) {
    return handleRouteError(error)
  }
}
