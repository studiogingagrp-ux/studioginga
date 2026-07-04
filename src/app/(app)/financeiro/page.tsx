import type { Metadata } from 'next'
import { cn } from '@/lib/utils'
import {
  GINGA_FINANCE, FINANCE_STATUS_META, clientOf, mx, isLate,
} from '@/lib/demo/agency'

export const metadata: Metadata = { title: 'Financeiro' }
export const dynamic = 'force-dynamic'

export default function FinanceiroPage() {
  const recebido = GINGA_FINANCE.filter((f) => f.status === 'pago').reduce((s, f) => s + f.amount, 0)
  const pendente = GINGA_FINANCE.filter((f) => f.status === 'pendente').reduce((s, f) => s + f.amount, 0)
  const atrasado = GINGA_FINANCE.filter((f) => f.status === 'atrasado').reduce((s, f) => s + f.amount, 0)
  const previsto = recebido + pendente + atrasado

  const kpis = [
    { label: 'Previsto no mês', value: mx(previsto), tone: 'text-foreground' },
    { label: 'Recebido',        value: mx(recebido), tone: 'text-emerald-300' },
    { label: 'A receber',       value: mx(pendente), tone: 'text-amber-300' },
    { label: 'Em atraso',       value: mx(atrasado), tone: 'text-rose-300' },
  ]

  const linhas = [...GINGA_FINANCE].sort((a, b) => a.due.localeCompare(b.due))

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="kicker text-brand">Financeiro</p>
        <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">Contratos & receita</h1>
        <p className="mt-1 text-sm text-muted-foreground">Contratos mensais, serviços avulsos e status de pagamento.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <p className="kicker text-muted-foreground/50">{k.label}</p>
            <p className={cn('mt-2 font-display text-xl font-extrabold tracking-tight tabular', k.tone)}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left kicker text-muted-foreground/50">
              <th className="px-5 py-3 font-medium">Cliente</th>
              <th className="hidden px-5 py-3 font-medium sm:table-cell">Descrição</th>
              <th className="px-5 py-3 font-medium">Vencimento</th>
              <th className="px-5 py-3 text-right font-medium">Valor</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((f) => {
              const c = clientOf(f.clientId)
              const meta = FINANCE_STATUS_META[f.status]
              const late = f.status === 'atrasado' || (f.status === 'pendente' && isLate(f.due))
              return (
                <tr key={f.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-foreground">{c?.name}</p>
                    <p className="text-xs text-muted-foreground sm:hidden">{f.description}</p>
                  </td>
                  <td className="hidden px-5 py-3.5 text-muted-foreground sm:table-cell">
                    {f.description}
                    <span className={cn('ml-2 rounded-full px-1.5 py-0.5 text-[10px]', f.type === 'contrato_mensal' ? 'bg-secondary text-muted-foreground' : 'bg-brand/10 text-brand')}>
                      {f.type === 'contrato_mensal' ? 'mensal' : 'avulso'}
                    </span>
                  </td>
                  <td className={cn('px-5 py-3.5 tabular', late ? 'text-rose-300' : 'text-muted-foreground')}>
                    {new Date(`${f.due}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium text-foreground tabular">{mx(f.amount)}</td>
                  <td className="px-5 py-3.5">
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium', meta.chip)}>
                      <span className={cn('size-1.5 rounded-full', meta.dot)} /> {meta.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
