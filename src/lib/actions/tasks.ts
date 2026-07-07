'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createSupabase } from '@/lib/supabase/server'
import type { OpTaskStatus, OpTaskType, Priority } from '@/types/database'

async function ctx() {
  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, ws: null as string | null, uid: null as string | null }
  const { data } = await supabase.from('profiles').select('workspace_id').eq('id', user.id).single()
  return { supabase, ws: (data?.workspace_id as string | null) ?? null, uid: user.id }
}

export async function createTask(input: {
  title: string; clientId?: string | null; memberId?: string | null
  type?: OpTaskType; priority?: Priority; due?: string | null
}) {
  const { supabase, ws, uid } = await ctx()
  if (!ws) return { error: 'Agência não encontrada.' }
  if (!input.title?.trim()) return { error: 'Informe o título da tarefa.' }

  const { data, error } = await supabase
    .from('op_tasks')
    .insert({
      workspace_id: ws,
      client_id: input.clientId || null,
      member_id: input.memberId || uid,
      title: input.title.trim(),
      type: input.type || 'arte',
      status: 'a_fazer',
      priority: input.priority || 'media',
      due_date: input.due || null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/operacao')
  return { ok: true, id: data.id as string }
}

export async function moveTask(id: string, status: OpTaskStatus) {
  const { supabase } = await ctx()
  const { error } = await supabase.from('op_tasks').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/operacao')
  return { ok: true }
}

export async function removeTask(id: string) {
  const { supabase } = await ctx()
  const { error } = await supabase.from('op_tasks').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/operacao')
  return { ok: true }
}
