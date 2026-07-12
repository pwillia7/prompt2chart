import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase-middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (build assets)
     * - _next/image (image optimizer)
     * - favicon
     * - static asset extensions
     */
    '/((?!_next/static|_next/image|favicon\\.(?:svg|ico)|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
