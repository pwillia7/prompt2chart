import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { Project } from '../types'

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  loading: boolean
  error: string | null
  fetchProjects: () => Promise<void>
  fetchProject: (id: string) => Promise<void>
  createProject: (name: string) => Promise<Project | null>
  updateProject: (id: string, name: string) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  setCurrentProject: (project: Project | null) => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ projects: data || [] })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  fetchProject: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      set({ currentProject: data })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  createProject: async (name: string) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('projects')
        .insert({ name, user_id: user.id })
        .select()
        .single()

      if (error) throw error

      set({ projects: [data, ...get().projects] })
      return data
    } catch (error) {
      set({ error: (error as Error).message })
      return null
    } finally {
      set({ loading: false })
    }
  },

  updateProject: async (id: string, name: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('projects')
        .update({ name })
        .eq('id', id)

      if (error) throw error

      set({
        projects: get().projects.map((p) =>
          p.id === id ? { ...p, name } : p
        ),
        currentProject: get().currentProject?.id === id
          ? { ...get().currentProject!, name }
          : get().currentProject,
      })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  deleteProject: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error

      set({
        projects: get().projects.filter((p) => p.id !== id),
        currentProject: get().currentProject?.id === id ? null : get().currentProject,
      })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ loading: false })
    }
  },

  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project })
  },
}))
