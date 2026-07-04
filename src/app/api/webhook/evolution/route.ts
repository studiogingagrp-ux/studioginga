import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendText, isEvolutionConfigured } from '@/lib/evolution-api'
import { parseCommand, HELP_MESSAGE } from '@/lib/atlas-bot'

// Evolution API envia eventos via POST neste endpoint.
// Configurar no painel Evolution: Webhook URL = https://seudominio.com/api/webhook/evolution

const fmtDateBr = (isoDate: string) =>
  new Date(`${isoDate}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })

const toHHMM = (ts: string) =>
  new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

async function reply(phone: string, text: string) {
  if (!isEvolutionConfigured()) return
  try { await sendText(phone, text) } catch { /* best-effort */ }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json() as Record<string, unknown>
    const event   = payload.event as string | undefined

    if (event !== 'messages.upsert') {
      return NextResponse.json({ ok: true })
    }

    const data    = payload.data as Record<string, unknown> | undefined
    const message = (data?.messages as Array<Record<string, unknown>> | undefined)?.[0]
      ?? (data as Record<string, unknown> | undefined) // formatos variam entre versões da Evolution
    if (!message) return NextResponse.json({ ok: true })

    const key = message.key as Record<string, unknown> | undefined
    if (key?.fromMe) return NextResponse.json({ ok: true })

    const remoteJid = key?.remoteJid as string | undefined
    if (!remoteJid || remoteJid.endsWith('@g.us')) return NextResponse.json({ ok: true }) // ignora grupos

    const phone = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '')

    const msgContent = message.message as Record<string, unknown> | undefined
    const body =
      (msgContent?.conversation as string | undefined) ??
      ((msgContent?.extendedTextMessage as Record<string, unknown> | undefined)?.text as string | undefined) ??
      ''

    const pushName  = message.pushName as string | undefined
    const timestamp = message.messageTimestamp as number | undefined

    const supabase = createAdminClient()

    // Log da mensagem (best-effort)
    try {
      await supabase.from('whatsapp_messages').insert({
        phone,
        name:        pushName ?? phone,
        body:        body || '[mídia]',
        direction:   'in',
        received_at: timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString(),
      })
    } catch { /* tabela pode não existir ainda */ }

    if (!body) return NextResponse.json({ ok: true })

    // ── Identifica o remetente: membro da equipe ou cliente ────────────────
    const { data: member } = await supabase
      .from('profiles')
      .select('id, workspace_id, full_name, role, phone')
      .eq('phone', phone)
      .eq('active', true)
      .maybeSingle()

    const cmd = parseCommand(body)

    // ── Cliente respondendo "SIM" → confirma a próxima reunião dele ────────
    if (!member) {
      if (cmd?.kind === 'confirm') {
        const { data: client } = await supabase
          .from('clients')
          .select('id, full_name, workspace_id')
          .eq('phone', phone)
          .maybeSingle()
        if (client) {
          const { data: next } = await supabase
            .from('events')
            .select('id, starts_at')
            .eq('client_id', client.id)
            .eq('status', 'agendado')
            .gte('starts_at', new Date().toISOString())
            .order('starts_at')
            .limit(1)
            .maybeSingle()
          if (next) {
            await supabase.from('events').update({ status: 'confirmado' }).eq('id', next.id)
            await reply(phone, `✅ Presença confirmada para *${toHHMM(next.starts_at as string)}*! Obrigado, ${(client.full_name as string).split(' ')[0]}. Até lá! 🚀`)
          }
        }
      }
      return NextResponse.json({ ok: true }) // clientes não recebem menu de comandos
    }

    // ── Membro da equipe: robô Atlas ativo ─────────────────────────────────
    if (!cmd) return NextResponse.json({ ok: true }) // conversa normal → silêncio

    if (cmd.kind === 'help' || cmd.kind === 'confirm') {
      await reply(phone, HELP_MESSAGE)
      return NextResponse.json({ ok: true })
    }

    if (cmd.kind === 'agenda') {
      const isOwner = member.role === 'dono'
      let query = supabase
        .from('events')
        .select('starts_at, title, status, visibility, member_id, profiles!member_id(full_name)')
        .eq('workspace_id', member.workspace_id)
        .gte('starts_at', `${cmd.date}T00:00:00`)
        .lte('starts_at', `${cmd.date}T23:59:59`)
        .neq('status', 'cancelado')
        .order('starts_at')
      if (!isOwner) query = query.eq('member_id', member.id)

      const { data: events } = await query
      const lines = (events ?? []).map((e) => {
        const raw = e as Record<string, unknown>
        const profArr = raw.profiles as Array<{ full_name: string }> | { full_name: string } | null
        const prof = Array.isArray(profArr) ? profArr[0] : profArr
        const who  = isOwner && prof ? ` _(${(prof.full_name as string).split(' ')[0]})_` : ''
        const isPrivateOfOther = raw.visibility === 'privado' && raw.member_id !== member.id
        const title = isPrivateOfOther ? '🔒 Ocupado' : (raw.title as string | null) ?? 'Evento'
        return `• *${toHHMM(raw.starts_at as string)}* — ${title}${who}`
      })
      const header = `📅 *Agenda ${isOwner ? 'da equipe' : ''} — ${fmtDateBr(cmd.date)}*`
      await reply(phone, lines.length ? `${header}\n\n${lines.join('\n')}` : `${header}\n\nNenhum evento. Dia livre! 🎉`)
      return NextResponse.json({ ok: true })
    }

    if (cmd.kind === 'create') {
      const startsAt = `${cmd.date}T${cmd.time}:00`
      const endsAt   = new Date(new Date(startsAt).getTime() + cmd.durationMin * 60_000).toISOString()
      const { error } = await supabase.from('events').insert({
        workspace_id: member.workspace_id,
        member_id:    member.id,
        starts_at:    startsAt,
        ends_at:      endsAt,
        status:       'agendado',
        type:         'reuniao',
        visibility:   'equipe',
        title:        cmd.title,
        created_by:   member.id,
      })
      if (error) {
        await reply(phone, `❌ Não consegui criar: ${error.message}`)
      } else {
        await reply(phone, `✅ *Criado!*\n\n📌 ${cmd.title}\n🗓 ${fmtDateBr(cmd.date)} às *${cmd.time}*\n\nJá está na sua agenda. 🚀`)
      }
      return NextResponse.json({ ok: true })
    }

    if (cmd.kind === 'cancel') {
      const { data: found } = await supabase
        .from('events')
        .select('id, title, starts_at')
        .eq('member_id', member.id)
        .gte('starts_at', `${cmd.date}T${cmd.time}:00`)
        .lte('starts_at', `${cmd.date}T${cmd.time}:59`)
        .neq('status', 'cancelado')
        .limit(1)
        .maybeSingle()
      if (!found) {
        await reply(phone, `🤔 Não achei nenhum evento seu em ${fmtDateBr(cmd.date)} às ${cmd.time}.`)
      } else {
        await supabase.from('events').update({ status: 'cancelado' }).eq('id', found.id)
        await reply(phone, `❌ Cancelado: *${(found.title as string | null) ?? 'Evento'}* — ${fmtDateBr(cmd.date)} às ${cmd.time}.`)
      }
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // sempre 200 p/ evitar retry loop da Evolution
  }
}
