import { createClient } from '@supabase/supabase-js'

// Service-role client for privileged server-only operations (credit
// deduction, rate-limit counting, usage logging). Bypasses RLS — never
// import this into client code. Requires SUPABASE_SERVICE_ROLE_KEY.
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
