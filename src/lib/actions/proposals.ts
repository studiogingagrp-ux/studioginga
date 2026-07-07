'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createSupabase } from '@/lib/supabase/server'

type ProposalStatus = 'rascunho' | 'enviada' | 'aceita' | 'recusada'

async function ctx() {
  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, ws: null as string | null }
  const { data } = await supabase.from('profiles').select('workspace_id').eq('id', user.id).single()
  return { supabase, ws: (data?.workspace_id as string | null) ?? null }
}

export async function createProposal(input: {
  clientId?: string | null
  title: string
  template?: string
  value?: number
  intro?: string
  validity?: number
  items?: { s: string; v: number }[]
  status?: ProposalStatus
}) {
  const { supabase, ws } = await ctx()
  if (!ws) return { error: 'Agência não encontrada.' }
  if (!input.title?.trim()) return { error: 'Informe o título da proposta.' }

  const { data, error } = await supabase
    .from('proposals')
    .insert({
      workspace_id: ws,
      client_id: input.clientId || null,
      title: input.title.trim(),
      template: input.template || null,
      value: Number(input.value) || 0,
      status: input.status || 'rascunho',
      items: input.items ?? [],
      intro: input.intro || null,
      validity: Number(input.validity) || 15,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/propostas')
  return { ok: true, id: data.id as string }
}

export async function setProposalStatus(id: string, status: ProposalStatus) {
  const { supabase } = await ctx()
  const { error } = await supabase.from('proposals').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/propostas')
  return { ok: true }
}

export async function removeProposal(id: string) {
  const { supabase } = await ctx()
  const { error } = await supabase.from('proposals').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/propostas')
  return { ok: true }
}
