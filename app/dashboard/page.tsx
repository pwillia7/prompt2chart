import { redirect } from 'next/navigation'
import { cacheLife, cacheTag } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { Project } from '@/types'
import DashboardClient from './DashboardClient'

async function getUserProjects(userId: string): Promise<Project[]> {
  'use cache: private'
  cacheTag(`user-${userId}-projects`)
  cacheLife('minutes')
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function Page() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const initialProjects = await getUserProjects(user.id)
  return <DashboardClient initialProjects={initialProjects} />
}
