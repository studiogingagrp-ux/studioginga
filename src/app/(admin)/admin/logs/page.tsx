import type { Metadata } from 'next'
import { ScrollText, Activity, Database, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = { title: 'Logs & Monitor · Super Admin' }
export const dynamic = 'force-dynamic'

const LOGS = [
  { time: '19:42', text: 'Empresa "Derma Center" — novo agendamento criado', icon: Activity },
  { time: '19:38', text: 'Backup automático concluído com sucesso', icon: Database },
  { time: '19:30', text: 'Empresa "Atlas Agenda Center" — WhatsApp reconectado', icon: ShieldCheck },
  { time: '19:12', text: 'Empresa "Empresa Renova" — upgrade para plano Membro', icon: Activity },
  { time: '18:55', text: 'Backup automático iniciado', icon: Database },
]

export default function AdminLogsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-2">
        <ScrollText className="size-5 text-brand" />
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Logs & Monitoramento</h1>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Uptime', value: '99,98%' },
          { label: 'Último backup', value: 'há 4 min' },
          { label: 'Eventos hoje', value: '1.842' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 text-center shadow-soft">
            <p className="font-heading text-xl font-semibold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        {LOGS.map((l, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border/60 px-5 py-3.5 last:border-0">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-brand"><l.icon className="size-4" /></span>
            <p className="flex-1 text-sm text-foreground">{l.text}</p>
            <span className="font-mono text-xs text-muted-foreground">{l.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
