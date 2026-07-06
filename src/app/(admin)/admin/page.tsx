import type { Metadata } from 'next'
import { DollarSign, Users, CreditCard, AlertTriangle, ExternalLink, Repeat, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getBillingOverview } from '@/lib/asaas'

export const metadata: Metadata = { title: 'Cobranças · Super Admin' }
export const dynamic = 'force-dynamic'

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDia = (d?: string) => d ? new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'

const STATUS: Record<string, { label: string; chip: string }> = {
  ACTIVE:   { label: 'Ativa',    chip: 'bg-emerald-500/15 text-emerald-300' },
  EXPIRED:  { label: 'Expirada', chip: 'bg-rose-500/15 text-rose-300' },
  INACTIVE: { label: 'Inativa',  chip: 'bg-zinc-500/15 text-zinc-300' },
}

export default async function AdminBilling() {
  const b = await getBillingOverview()

  const kpis = [
    { label: 'MRR (receita recorrente)', value: brl(b.mrr), icon: DollarSign, tone: 'text-emerald-300' },
    { label: 'Assinaturas ativas', value: String(b.activeCount), icon: Repeat, tone: 'text-foreground' },
    { label: 'Clientes', value: String(b.clientCount), icon: Users, tone: 'text-foreground' },
    { label: 'Em atraso', value: brl(b.overdueTotal), icon: AlertTriangle, tone: b.overdueTotal ? 'text-rose-300' : 'text-emerald-300' },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">Painel do Dono · Cobranças</h1>
        <p className="mt-1 text-sm text-muted-foreground">Suas assinaturas, receita e inadimplência — ao vivo do Asaas.</p>
      </div>

      {!b.ok && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          <TriangleAlert className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-medium">Não consegui consultar o Asaas.</p>
            <p className="mt-0.5 text-xs text-amber-200/80">{b.error} — confira se a variável <code className="rounded bg-black/20 px-1">ASAAS_API_KEY</code> está configurada no ambiente.</p>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <span className="grid size-10 place-items-center rounded-xl bg-secondary"><k.icon className={cn('size-5', k.tone)} /></span>
            <p className={cn('mt-4 font-display text-2xl font-extrabold tabular', k.tone)}>{k.value}</p>
            <p className="text-sm text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Assinaturas */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
            <CreditCard className="size-4 text-brand" />
            <h2 className="font-display text-sm font-bold text-foreground">Assinaturas</h2>
            <span className="ml-auto kicker text-muted-foreground/50">{b.subscriptions.length}</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left kicker text-muted-foreground/50">
                <th className="px-5 py-2.5 font-medium">Cliente</th>
                <th className="px-3 py-2.5 font-medium">Próx. venc.</th>
                <th className="px-3 py-2.5 text-right font-medium">Valor</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {b.subscriptions.map((s) => {
                const st = STATUS[s.status] ?? { label: s.status, chip: 'bg-secondary text-muted-foreground' }
                return (
                  <tr key={s.id} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground">{s.customer}</p>
                      {s.email && <p className="text-xs text-muted-foreground">{s.email}</p>}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground tabular">{fmtDia(s.nextDueDate)}</td>
                    <td className="px-3 py-3 text-right font-medium text-foreground tabular">{brl(s.value)}</td>
                    <td className="px-5 py-3"><span className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', st.chip)}>{st.label}</span></td>
                  </tr>
                )
              })}
              {b.subscriptions.length === 0 && b.ok && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhuma assinatura ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Inadimplência */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
            <AlertTriangle className="size-4 text-rose-300" />
            <h2 className="font-display text-sm font-bold text-foreground">Em atraso</h2>
          </div>
          <ul className="divide-y divide-border">
            {b.overdue.map((o) => (
              <li key={o.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{o.customer}</p>
                  <p className="text-xs text-rose-300">venceu {fmtDia(o.dueDate)}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-foreground tabular">{brl(o.value)}</span>
                {o.invoiceUrl && (
                  <a href={o.invoiceUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-brand" title="Abrir cobrança"><ExternalLink className="size-4" /></a>
                )}
              </li>
            ))}
            {b.overdue.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-emerald-300">Ninguém em atraso 🎉</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
