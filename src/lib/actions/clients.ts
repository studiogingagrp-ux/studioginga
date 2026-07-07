'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createSupabase } from '@/lib/supabase/server'

export type ClienteStatus = 'ativo' | 'pausado' | 'prospect'

export interface AgencyClientInput {
  name: string
  segment?: string
  contact?: string
  phone?: string
  email?: string
  monthly?: number
  status?: ClienteStatus
}

async function workspaceId() {
  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, ws: null as string | null }
  const { data } = await supabase.from('profiles').select('workspace_id').eq('id', user.id).single()
  return { supabase, ws: (data?.workspace_id as string | null) ?? null }
}

export async function createAgencyClient(input: AgencyClientInput) {
  const { supabase, ws } = await workspaceId()
  if (!ws) return { error: 'Agência não encontrada. Faça login novamente.' }
  if (!input.name?.trim()) return { error: 'Informe o nome do cliente.' }

  const { data, error } = await supabase
    .from('clients')
    .insert({
      workspace_id: ws,
      full_name: input.name.trim(),
      phone: (input.phone || '').replace(/\D/g, ''),
      email: input.email?.trim() || null,
      company: input.segment?.trim() || null,
      extra: {
        segment: input.segment?.trim() || '',
        contact: input.contact?.trim() || '',
        monthly: Number(input.monthly) || 0,
        status: input.status || 'ativo',
      },
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/clientes')
  return { ok: true, id: data.id as string }
}

export async function updateAgencyClient(id: string, input: AgencyClientInput) {
  const { supabase, ws } = await workspaceId()
  if (!ws) return { error: 'Agência não encontrada.' }

  const { data: cur } = await supabase.from('clients').select('extra').eq('id', id).single()
  const extra = { ...(cur?.extra as Record<string, unknown> ?? {}) }
  if (input.segment !== undefined) extra.segment = input.segment.trim()
  if (input.contact !== undefined) extra.contact = input.contact.trim()
  if (input.monthly !== undefined) extra.monthly = Number(input.monthly) || 0
  if (input.status !== undefined) extra.status = input.status

  const { error } = await supabase
    .from('clients')
    .update({
      ...(input.name && { full_name: input.name.trim() }),
      ...(input.phone !== undefined && { phone: input.phone.replace(/\D/g, '') }),
      ...(input.email !== undefined && { email: input.email.trim() || null }),
      ...(input.segment !== undefined && { company: input.segment.trim() || null }),
      extra,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/clientes')
  return { ok: true }
}

export async function removeAgencyClient(id: string) {
  const { supabase } = await workspaceId()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/clientes')
  return { ok: true }
}
