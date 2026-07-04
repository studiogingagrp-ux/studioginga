'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createSupabase } from '@/lib/supabase/server'

export async function createClientRecord(data: {
  name: string
  phone: string
  company?: string
  email?: string
  notes?: string
}) {
  const supabase = await createSupabase()

  const { data: profile } = await supabase
    .from('profiles')
    .select('workspace_id')
    .single()
  const workspaceId = profile?.workspace_id as string | undefined
  if (!workspaceId) return { error: 'Workspace não encontrado' }

  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      workspace_id: workspaceId,
      full_name:    data.name.trim(),
      phone:        data.phone.replace(/\D/g, ''),
      company:      data.company?.trim() || null,
      email:        data.email?.trim() || null,
      notes:        data.notes?.trim() || null,
    })
    .select('id, full_name, phone, company, email')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/clientes')
  return {
    client: {
      id:        client.id as string,
      name:      client.full_name as string,
      phone:     client.phone as string,
      company:   (client.company as string | null) ?? '—',
      email:     (client.email as string | null) ?? undefined,
      lastVisit: '—',
    },
  }
}

export async function updateClientRecord(id: string, data: {
  name?: string
  phone?: string
  company?: string
  email?: string
  notes?: string
}) {
  const supabase = await createSupabase()
  const { error } = await supabase
    .from('clients')
    .update({
      ...(data.name    && { full_name: data.name.trim() }),
      ...(data.phone   && { phone: data.phone.replace(/\D/g, '') }),
      ...(data.company !== undefined && { company: data.company.trim() || null }),
      ...(data.email   !== undefined && { email: data.email.trim() || null }),
      ...(data.notes   !== undefined && { notes: data.notes.trim() || null }),
    })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/clientes')
  return { success: true }
}

export async function deleteClientRecord(id: string) {
  const supabase = await createSupabase()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/clientes')
  return { success: true }
}
