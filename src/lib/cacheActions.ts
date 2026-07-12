'use server'

import { updateTag } from 'next/cache'
import { createSupabaseServerClient } from './supabase-server'

// Read-your-own-writes cache invalidation for the Phase 2d cached fetchers.
// updateTag must be called from a Server Action; it immediately expires the
// tagged private-cache entry so the next navigation refetches fresh data.

// Busts the current user's dashboard project list. userId is read from the
// session server-side, never trusted from the client.
export async function bustUserProjects(): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  updateTag(`user-${user.id}-projects`)
}

export async function bustProject(projectId: string): Promise<void> {
  updateTag(`project-${projectId}`)
}

export async function bustProjectCharts(projectId: string): Promise<void> {
  updateTag(`project-${projectId}-charts`)
}

export async function bustProjectDatasets(projectId: string): Promise<void> {
  updateTag(`project-${projectId}-datasets`)
}
