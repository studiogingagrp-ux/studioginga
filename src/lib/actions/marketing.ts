'use server'

// Actions dos módulos de marketing — Pipeline, Campanhas, Conteúdo e Sala de Reunião.
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { LeadStage, TaskStatus, ContentStatus, MeetingAgendaItem, MeetingActionItem } from '@/types/database'

async function ctx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, workspace_id')
    .eq('id', user.id)
    .single()
  if (!profile?.workspace_id) return null
  return { supabase, userId: user.id, workspaceId: profile.workspace_id as string }
}

// ── PIPELINE ─────────────────────────────────────────────────
export async function createLead(data: {
  name: string; company?: string; phone?: string; value: number; memberId?: string
}) {
  const c = await ctx()
  if (!c) return { error: 'Não autenticado' }
  const { data: lead, error } = await c.supabase
    .from('leads')
    .insert({
      workspace_id: c.workspaceId,
      member_id:    data.memberId ?? c.userId,
      name:         data.name.trim(),
      company:      data.company?.trim() || null,
      phone:        data.phone?.replace(/\D/g, '') || null,
      value:        data.value,
      stage:        'novo',
    })
    .select('id')
    .single()
  if (error) return { error: error.message }
  revalidatePath('/pipeline')
  return { id: lead.id as string }
}

export async function moveLeadStage(id: string, stage: LeadStage) {
  const c = await ctx()
  if (!c) return { error: 'Não autenticado' }
  const { error } = await c.supabase
    .from('leads')
    .update({ stage, stage_since: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/pipeline')
  return { success: true }
}

// ── CAMPANHAS ────────────────────────────────────────────────
export async function createTask(data: {
  title: string; clientId?: string; memberId: string; due: string; tag?: string
}) {
  const c = await ctx()
  if (!c) return { error: 'Não autenticado' }
  const { data: task, error } = await c.supabase
    .from('tasks')
    .insert({
      workspace_id: c.workspaceId,
      client_id:    data.clientId ?? null,
      member_id:    data.memberId,
      title:        data.title.trim(),
      status:       'a_fazer',
      due_date:     data.due,
      tag:          data.tag?.trim() || null,
    })
    .select('id')
    .single()
  if (error) return { error: error.message }
  revalidatePath('/campanhas')
  return { id: task.id as string }
}

export async function moveTask(id: string, status: TaskStatus) {
  const c = await ctx()
  if (!c) return { error: 'Não autenticado' }
  const { error } = await c.supabase.from('tasks').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/campanhas')
  return { success: true }
}

// ── CONTEÚDO ─────────────────────────────────────────────────
export async function createPost(data: {
  title: string; clientId?: string; channel: string; date: string
}) {
  const c = await ctx()
  if (!c) return { error: 'Não autenticado' }
  const { data: post, error } = await c.supabase
    .from('content_posts')
    .insert({
      workspace_id: c.workspaceId,
      client_id:    data.clientId ?? null,
      member_id:    c.userId,
      title:        data.title.trim(),
      channel:      data.channel,
      status:       'rascunho',
      publish_date: data.date,
    })
    .select('id')
    .single()
  if (error) return { error: error.message }
  revalidatePath('/conteudo')
  return { id: post.id as string }
}

export async function setPostStatus(id: string, status: ContentStatus) {
  const c = await ctx()
  if (!c) return { error: 'Não autenticado' }
  const { error } = await c.supabase.from('content_posts').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/conteudo')
  return { success: true }
}

// ── SALA DE REUNIÃO ──────────────────────────────────────────
export async function saveMeetingDetail(eventId: string, data: {
  agenda: MeetingAgendaItem[]; notes: string; actions: MeetingActionItem[]; callUrl?: string | null
}) {
  const c = await ctx()
  if (!c) return { error: 'Não autenticado' }
  const { error } = await c.supabase
    .from('meeting_details')
    .upsert({
      event_id:     eventId,
      workspace_id: c.workspaceId,
      call_url:     data.callUrl ?? null,
      agenda:       data.agenda,
      notes:        data.notes,
      actions:      data.actions,
      updated_at:   new Date().toISOString(),
    }, { onConflict: 'event_id' })
  if (error) return { error: error.message }
  return { success: true }
}
