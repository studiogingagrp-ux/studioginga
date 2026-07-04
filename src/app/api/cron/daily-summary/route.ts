import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendText, isEvolutionConfigured } from '@/lib/evolution-api'

// Resumo diário da agenda para o(s) dono(s) — Vercel Cron às 7h BRT (10h UTC).
// vercel.json: { "path": "/api/cron/daily-summary", "schedule": "0 10 * * 1-5" }
export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isEvolutionConfigured()) {
    return NextResponse.json({ skipped: 'Evolution API not configured' })
  }

  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // Donos com telefone cadastrado recebem o resumo
  const { data: owners, error } = await supabase
    .from('profiles')
    .select('id, workspace_id, full_name, phone')
    .eq('role', 'dono')
    .eq('active', true)
    .not('phone', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const sent: string[] = []

  for (const owner of (owners ?? [])) {
    const { data: events } = await supabase
      .from('events')
      .select('starts_at, title, type, visibility, member_id, profiles!member_id(full_name)')
      .eq('workspace_id', owner.workspace_id as string)
      .gte('starts_at', `${today}T00:00:00`)
      .lte('starts_at', `${today}T23:59:59`)
      .neq('status', 'cancelado')
      .neq('type', 'bloqueio')
      .order('starts_at')

    const list = events ?? []
    const dateBr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })

    let msg: string
    if (list.length === 0) {
      msg = `☀️ Bom dia, ${(owner.full_name as string).split(' ')[0]}!\n\n📅 *${dateBr}* — agenda da equipe livre hoje. Bora prospectar? 🚀\n\n_Atlas Agenda Center_`
    } else {
      const lines = list.map((e) => {
        const raw = e as Record<string, unknown>
        const profArr = raw.profiles as Array<{ full_name: string }> | { full_name: string } | null
        const prof = Array.isArray(profArr) ? profArr[0] : profArr
        const who  = prof ? ` _(${(prof.full_name as string).split(' ')[0]})_` : ''
        const time = new Date(raw.starts_at as string).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        // Privado de outro membro aparece mascarado até para o resumo
        const isPrivateOfOther = raw.visibility === 'privado' && raw.member_id !== owner.id
        const title = isPrivateOfOther ? '🔒 Ocupado' : ((raw.title as string | null) ?? 'Evento')
        return `• *${time}* — ${title}${who}`
      })
      msg = `☀️ Bom dia, ${(owner.full_name as string).split(' ')[0]}!\n\n📅 *Agenda da equipe — ${dateBr}*\n\n${lines.join('\n')}\n\nBom trabalho! 🚀\n\n_Atlas Agenda Center_`
    }

    try {
      await sendText(owner.phone as string, msg)
      sent.push(owner.phone as string)
    } catch { /* segue para o próximo dono */ }
  }

  return NextResponse.json({ sent: sent.length, date: today })
}
