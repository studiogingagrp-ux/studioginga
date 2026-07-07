'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createSupabase } from '@/lib/supabase/server'
import type { LeadStage } from '@/types/database'

async function ctx() {
  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, ws: null as string | null, uid: null as string | null }
  const { data } = await supabase.from('profiles').select('workspace_id').eq('id', user.id).single()
  return { supabase, ws: (data?.workspace_id as string | null) ?? null, uid: user.id }
}

export async function createLead(input: { company: string; name: string; value?: number; memberId?: string | null; source?: string }) {
  const { supabase, ws, uid } = await ctx()
  if (!ws) return { error: 'Agência não encontrada.' }
  if (!input.company?.trim() || !input.name?.trim()) return { error: 'Informe empresa e contato.' }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      workspace_id: ws,
      member_id: input.memberId || uid,
      company: input.company.trim(),
      name: input.name.trim(),
      value: Number(input.value) || 0,
      stage: 'novo',
      source: input.source || 'Indicação',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/comercial')
  return { ok: true, id: data.id as string }
}

export async function moveLead(id: string, stage: LeadStage) {
  const { supabase } = await ctx()
  const { error } = await supabase.from('leads').update({ stage }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/comercial')
  return { ok: true }
}

export async function removeLead(id: string) {
  const { supabase } = await ctx()
  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/comercial')
  return { ok: true }
}
