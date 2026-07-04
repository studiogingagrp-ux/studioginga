import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendText, isEvolutionConfigured } from '@/lib/evolution-api'

// Vercel Cron chama este endpoint todo dia às 18h (BRT = 21h UTC)
// Configure em vercel.json: { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 21 * * *" }] }
export async function GET(req: Request) {
  // Verificar que é chamada legítima da Vercel
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isEvolutionConfigured()) {
    return NextResponse.json({ skipped: 'Evolution API not configured' })
  }

  const supabase = createAdminClient()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tStr = tomorrow.toISOString().split('T')[0]

  const { data: appts, error } = await supabase
    .from('events')
    .select('id, starts_at, clients(full_name, phone)')
    .gte('starts_at', `${tStr}T00:00:00`)
    .lte('starts_at', `${tStr}T23:59:59`)
    .in('status', ['agendado', 'confirmado'])
    .neq('type', 'bloqueio')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const sent: string[] = []
  const failed: string[] = []

  for (const appt of (appts ?? [])) {
    const raw = appt as Record<string, unknown>
    const pArr = raw.clients as Array<{ full_name: string; phone: string }> | null
    const client = Array.isArray(pArr) ? pArr[0] : pArr
    if (!client?.phone) continue

    const dt   = new Date(raw.starts_at as string)
    const time = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const msg  = `Olá, ${client.full_name.split(' ')[0]}! 👋\n\nLembrete: você tem uma *reunião amanhã às ${time}*.\n\nConfirme sua presença respondendo *SIM* — ou avise com antecedência se precisar remarcar.\n\nAté breve! 💙\n\n_Atlas Agenda Center_`

    try {
      await sendText(client.phone, msg)
      sent.push(client.phone)
    } catch {
      failed.push(client.phone)
    }
  }

  return NextResponse.json({ sent: sent.length, failed: failed.length, date: tStr })
}
