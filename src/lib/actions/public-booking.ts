'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export async function createPublicBooking(data: {
  workspaceId: string
  memberId: string
  title: string
  phone: string
  date: string
  time: string
  company?: string
  topic?: string
}): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = createAdminClient()
    const phone    = data.phone.replace(/\D/g, '')

    // Localiza ou cria o cliente pelo telefone dentro do workspace
    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('workspace_id', data.workspaceId)
      .eq('phone', phone)
      .maybeSingle()

    let clientId: string
    if (existing) {
      clientId = existing.id as string
    } else {
      const { data: newClient, error: cliErr } = await supabase
        .from('clients')
        .insert({
          workspace_id: data.workspaceId,
          full_name:    data.title.trim(),
          phone,
          company:      data.company?.trim() || null,
        })
        .select('id')
        .single()
      if (cliErr) return { error: cliErr.message }
      clientId = newClient.id as string
    }

    // Cria reunião de 30 min
    const startMs = new Date(`${data.date}T${data.time}:00`).getTime()
    const endsAt  = new Date(startMs + 30 * 60 * 1000).toISOString()

    const { error } = await supabase
      .from('events')
      .insert({
        workspace_id: data.workspaceId,
        client_id:    clientId,
        member_id:    data.memberId,
        starts_at:    `${data.date}T${data.time}:00`,
        ends_at:      endsAt,
        status:       'agendado',
        type:         'reuniao',
        visibility:   'equipe',
        title:        data.topic?.trim() ? `Reunião — ${data.topic.trim()}` : null,
        notes:        data.topic?.trim() || null,
      })

    if (error) return { error: error.message }

    // Confirmação imediata no WhatsApp do cliente (best-effort; não bloqueia o agendamento)
    const dateBr = new Date(`${data.date}T${data.time}:00`).toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: '2-digit',
    })
    void sendWhatsAppMessage(
      phone,
      `✅ *Reunião confirmada!*\n\nOlá, ${data.title.split(' ')[0]}! Sua reunião está marcada para *${dateBr} às ${data.time}*.\n\nVocê receberá um lembrete antes do horário. Até lá! 🚀\n\n_Atlas Agenda Center_`,
    ).catch(() => null)

    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao agendar' }
  }
}
