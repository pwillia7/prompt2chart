import { requireUser } from '@/lib/server/auth'
import { handleRouteError } from '@/lib/server/respond'
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin'

export const maxDuration = 30

// Refund 1 credit for a chart that failed to render. Verifies the chart
// belongs to the caller via project ownership before crediting.
export async function POST(req: Request) {
  try {
    const user = await requireUser()

    const { chartId } = (await req.json()) as { chartId?: string }
    if (!chartId) {
      return Response.json({ error: 'Missing chartId' }, { status: 400 })
    }

    const admin = createSupabaseAdminClient()

    const { data: chart, error: chartError } = await admin
      .from('charts')
      .select('id, project_id')
      .eq('id', chartId)
      .single()
    if (chartError || !chart) {
      return Response.json({ error: 'Chart not found' }, { status: 404 })
    }

    const { data: project, error: projectError } = await admin
      .from('projects')
      .select('id')
      .eq('id', chart.project_id)
      .eq('user_id', user.id)
      .single()
    if (projectError || !project) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data: current, error: fetchError } = await admin
      .from('user_credits')
      .select('balance')
      .eq('user_id', user.id)
      .single()
    if (fetchError || !current) {
      return Response.json({ error: 'Could not fetch credit balance' }, { status: 500 })
    }

    const newBalance = current.balance + 1
    const { error: updateError } = await admin
      .from('user_credits')
      .update({ balance: newBalance })
      .eq('user_id', user.id)
    if (updateError) {
      console.error('Credit refund failed:', updateError)
      return Response.json({ error: 'Refund failed' }, { status: 500 })
    }

    return Response.json({ balance: newBalance, refunded: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
