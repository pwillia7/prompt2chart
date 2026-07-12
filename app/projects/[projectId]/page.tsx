import { redirect, notFound } from 'next/navigation'
import { cacheLife, cacheTag } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { Chart, Dataset, Project } from '@/types'
import ProjectClient from './ProjectClient'

type Params = Promise<{ projectId: string }>

// projects has a user_id column → filter explicitly (defense-in-depth over RLS).
async function getProject(projectId: string, userId: string): Promise<Project | null> {
  'use cache: private'
  cacheTag(`project-${projectId}`)
  cacheLife('minutes')
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single()
  return data ?? null
}

// charts/datasets have no user_id column — authorization is via RLS (EXISTS join
// to projects.user_id) plus the page proving project ownership before calling these.
// userId is still in the signature so it's part of the cache key.
async function getProjectCharts(projectId: string, _userId: string): Promise<Chart[]> {
  'use cache: private'
  cacheTag(`project-${projectId}-charts`)
  cacheLife('minutes')
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('charts')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  return (data ?? []) as Chart[]
}

async function getProjectDatasets(projectId: string, _userId: string): Promise<Dataset[]> {
  'use cache: private'
  cacheTag(`project-${projectId}-datasets`)
  cacheLife('minutes')
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('datasets')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  return (data ?? []) as Dataset[]
}

export default async function Page({ params }: { params: Params }) {
  const { projectId } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const project = await getProject(projectId, user.id)
  if (!project) notFound()

  const [charts, datasets] = await Promise.all([
    getProjectCharts(projectId, user.id),
    getProjectDatasets(projectId, user.id),
  ])

  return (
    <ProjectClient
      initialProject={project}
      initialCharts={charts}
      initialDatasets={datasets}
    />
  )
}
