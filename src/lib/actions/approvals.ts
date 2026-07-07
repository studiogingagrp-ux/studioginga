'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createSupabase } from '@/lib/supabase/server'
import type { ApprovalStatus, ApprovalType } from '@/types/database'

async function ctx() {
  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, ws: null as string | null }
  const { data } = await supabase.from('profiles').select('workspace_id').eq('id', user.id).single()
  return { supabase, ws: (data?.workspace_id as string | null) ?? null }
}

export async function createApproval(input: { title: string; clientId?: string | null; type?: ApprovalType; caption?: string }) {
  const { supabase, ws } = await ctx()
  if (!ws) return { error: 'Agência não encontrada.' }
  if (!input.title?.trim()) return { error: 'Informe o título do material.' }

  const { data, error } = await supabase
    .from('approvals')
    .insert({
      workspace_id: ws,
      client_id: input.clientId || null,
      title: input.title.trim(),
      type: input.type || 'arte',
      status: 'enviado',
      version: 1,
      caption: input.caption?.trim() || null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/aprovacoes')
  return { ok: true, id: data.id as string }
}

export async function setApprovalStatus(id: string, status: ApprovalStatus) {
  const { supabase } = await ctx()
  const { error } = await supabase.from('approvals').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/aprovacoes')
  return { ok: true }
}

export async function reenviarApproval(id: string, version: number) {
  const { supabase } = await ctx()
  const { error } = await supabase.from('approvals').update({ status: 'reenviado', version: version + 1 }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/aprovacoes')
  return { ok: true }
}

export async function addApprovalComment(approvalId: string, text: string, fromClient: boolean, author?: string) {
  const { supabase, ws } = await ctx()
  if (!ws) return { error: 'Agência não encontrada.' }
  if (!text.trim()) return { error: 'Escreva um comentário.' }
  const { data, error } = await supabase
    .from('approval_comments')
    .insert({ approval_id: approvalId, workspace_id: ws, author: author || (fromClient ? 'Cliente' : 'Ginga Studio'), from_client: fromClient, text: text.trim() })
    .select('id')
    .single()
  if (error) return { error: error.message }
  revalidatePath('/aprovacoes')
  return { ok: true, id: data.id as string }
}

export async function removeApproval(id: string) {
  const { supabase } = await ctx()
  const { error } = await supabase.from('approvals').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/aprovacoes')
  return { ok: true }
}
