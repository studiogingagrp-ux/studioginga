'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createSupabase } from '@/lib/supabase/server'
import type { ContentChannel, ContentStatus } from '@/types/database'

async function ctx() {
  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, ws: null as string | null }
  const { data } = await supabase.from('profiles').select('workspace_id').eq('id', user.id).single()
  return { supabase, ws: (data?.workspace_id as string | null) ?? null }
}

export async function createPost(input: {
  title: string
  clientId?: string | null
  channel: ContentChannel
  status?: ContentStatus
  scheduledOn: string // YYYY-MM-DD
}) {
  const { supabase, ws } = await ctx()
  if (!ws) return { error: 'Agência não encontrada.' }
  if (!input.title?.trim()) return { error: 'Informe o título da publicação.' }
  if (!input.scheduledOn) return { error: 'Escolha a data.' }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      workspace_id: ws,
      client_id: input.clientId || null,
      title: input.title.trim(),
      channel: input.channel,
      status: input.status || 'rascunho',
      scheduled_on: input.scheduledOn,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/conteudo')
  return { ok: true, id: data.id as string }
}

export async function setPostStatus(id: string, status: ContentStatus) {
  const { supabase } = await ctx()
  const { error } = await supabase.from('posts').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/conteudo')
  return { ok: true }
}

export async function removePost(id: string) {
  const { supabase } = await ctx()
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/conteudo')
  return { ok: true }
}
