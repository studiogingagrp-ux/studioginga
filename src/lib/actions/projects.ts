'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createSupabase } from '@/lib/supabase/server'
import type { ProjectStatus, Priority } from '@/types/database'

export interface ProjectInput {
  name: string
  clientId?: string | null
  description?: string
  deadline?: string | null
  status?: ProjectStatus
  priority?: Priority
  progress?: number
}

async function ctx() {
  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, ws: null as string | null }
  const { data } = await supabase.from('profiles').select('workspace_id').eq('id', user.id).single()
  return { supabase, ws: (data?.workspace_id as string | null) ?? null }
}

export async function createProject(input: ProjectInput) {
  const { supabase, ws } = await ctx()
  if (!ws) return { error: 'Agência não encontrada.' }
  if (!input.name?.trim()) return { error: 'Informe o nome do projeto.' }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      workspace_id: ws,
      client_id: input.clientId || null,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      deadline: input.deadline || null,
      status: input.status || 'planejamento',
      priority: input.priority || 'media',
      progress: Math.max(0, Math.min(100, Number(input.progress) || 0)),
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/projetos')
  return { ok: true, id: data.id as string }
}

export async function updateProject(id: string, input: ProjectInput) {
  const { supabase } = await ctx()
  const { error } = await supabase
    .from('projects')
    .update({
      ...(input.name && { name: input.name.trim() }),
      ...(input.clientId !== undefined && { client_id: input.clientId || null }),
      ...(input.description !== undefined && { description: input.description.trim() || null }),
      ...(input.deadline !== undefined && { deadline: input.deadline || null }),
      ...(input.status && { status: input.status }),
      ...(input.priority && { priority: input.priority }),
      ...(input.progress !== undefined && { progress: Math.max(0, Math.min(100, Number(input.progress) || 0)) }),
    })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/projetos')
  return { ok: true }
}

export async function removeProject(id: string) {
  const { supabase } = await ctx()
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/projetos')
  return { ok: true }
}
