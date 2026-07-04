'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { EventStatus } from '@/types/database'
import { sendText, isEvolutionConfigured } from '@/lib/evolution-api'

export async function updateEventStatus(id: string, status: EventStatus) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('events')
    .update({ status })
    .eq('id', id)
  if (error) return { error: error.message }

  // Mensagem automática de confirmação via WhatsApp
  if (status === 'confirmado' && isEvolutionConfigured()) {
    try {
      const { data: appt } = await supabase
        .from('events')
        .select('starts_at, clients(full_name, phone)')
        .eq('id', id)
        .single()
      const raw = appt as Record<string, unknown> | null
      if (raw) {
        const pArr = raw.clients as Array<{ full_name: string; phone: string }> | null
        const client = Array.isArray(pArr) ? pArr[0] : (pArr as typeof pArr)
        if (client?.phone) {
          const dt  = new Date(raw.starts_at as string)
          const day = dt.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
          const time = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          const msg = `Olá, ${client.full_name.split(' ')[0]}! ✅\n\nSua reunião está *confirmada*:\n📅 ${day} às ${time}\n\nAté breve! 💙`
          await sendText(client.phone, msg).catch(() => null)
        }
      }
    } catch {
      // Não bloquear a confirmação se o WhatsApp falhar
    }
  }

  // Quando cancela, notifica próximo da fila de espera via WhatsApp
  if (status === 'cancelado' && isEvolutionConfigured()) {
    try {
      const { data: appt } = await supabase
        .from('events')
        .select('starts_at, member_id')
        .eq('id', id)
        .single()
      const raw = appt as Record<string, unknown> | null
      if (raw?.member_id) {
        // Primeiro da fila para este membro com prioridade
        const { data: waitItem } = await supabase
          .from('waitlist')
          .select('id, clients(full_name, phone)')
          .eq('member_id', raw.member_id as string)
          .eq('status', 'aguardando')
          .order('priority', { ascending: false })
          .order('created_at')
          .limit(1)
          .maybeSingle()

        const wRaw = waitItem as Record<string, unknown> | null
        if (wRaw) {
          const pArr = wRaw.clients as Array<{ full_name: string; phone: string }> | null
          const client = Array.isArray(pArr) ? pArr[0] : pArr
          if (client?.phone) {
            const dt   = new Date(raw.starts_at as string)
            const day  = dt.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
            const time = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            const msg  = `Olá, ${client.full_name.split(' ')[0]}! 🎉\n\nBoa notícia! Uma vaga acabou de abrir:\n📅 ${day} às ${time}\n\nResponda *SIM* para confirmar ou entre em contato. Atenção: vagas são preenchidas rapidamente!`
            await sendText(client.phone, msg).catch(() => null)
            // Atualizar status na fila
            await supabase
              .from('waitlist')
              .update({ status: 'notificado' })
              .eq('id', wRaw.id as string)
          }
        }
      }
    } catch {
      // Não bloquear cancelamento
    }
  }

  revalidatePath('/agenda')
  revalidatePath('/agenda')
  return { success: true }
}

export async function createEvent(data: {
  memberId: string
  clientId?: string
  title?: string
  phone?: string
  date: string
  start: string
  durationMin: number
  type: string
  notes?: string
}) {
  const supabase = await createClient()

  // Busca workspace_id do profile logado
  const { data: profile } = await supabase
    .from('profiles')
    .select('workspace_id')
    .single()
  const workspaceId = profile?.workspace_id as string | undefined
  if (!workspaceId) return { error: 'Empresa não encontrada' }

  const startsAt = new Date(`${data.date}T${data.start}:00`)
  const endsAt = new Date(startsAt.getTime() + data.durationMin * 60000)

  // If no clientId, try to find by phone (within workspace) or create inline
  let clientId = data.clientId
  if (!clientId && data.title?.trim()) {
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('phone', (data.phone ?? '').replace(/\D/g, ''))
      .maybeSingle()
    if (existing) {
      clientId = existing.id
    } else if (data.title && data.phone) {
      const { data: created } = await supabase
        .from('clients')
        .insert({
          workspace_id: workspaceId,
          full_name: data.title.trim(),
          phone: data.phone.replace(/\D/g, ''),
        })
        .select('id')
        .single()
      if (created) clientId = created.id
    }
  }

  const { data: appt, error } = await supabase
    .from('events')
    .insert({
      workspace_id:       workspaceId,
      member_id: data.memberId,
      client_id:      clientId ?? null,
      starts_at:       startsAt.toISOString(),
      ends_at:         endsAt.toISOString(),
      status:          'agendado',
      type:            data.type,
      title:           !clientId ? (data.title ?? null) : null,
      notes:           data.notes?.trim() || null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/agenda')
  revalidatePath('/dashboard')
  return { id: appt.id }
}

export async function saveEventNote(id: string, notes: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('events')
    .update({ notes: notes.trim() || null })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/agenda')
  revalidatePath('/agenda')
  return { success: true }
}

export async function deleteEvent(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/agenda')
  revalidatePath('/dashboard')
  revalidatePath('/agenda')
  return { success: true }
}

export async function moveEvent(id: string, memberId: string, newStart: string) {
  const supabase = await createClient()
  const { data: current } = await supabase
    .from('events')
    .select('starts_at, ends_at')
    .eq('id', id)
    .single()
  if (!current) return { error: 'Agendamento não encontrado' }

  const oldStart  = new Date(current.starts_at)
  const oldEnd    = new Date(current.ends_at)
  const duration  = oldEnd.getTime() - oldStart.getTime()
  const [hh, mm]  = newStart.split(':').map(Number)
  const newDate   = new Date(oldStart)
  newDate.setHours(hh, mm, 0, 0)
  const newEnd    = new Date(newDate.getTime() + duration)

  const { error } = await supabase
    .from('events')
    .update({ member_id: memberId, starts_at: newDate.toISOString(), ends_at: newEnd.toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/agenda')
  return { success: true }
}
