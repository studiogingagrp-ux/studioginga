import type { Metadata } from 'next'
import Link from 'next/link'
import { Building2, DollarSign, Users, CalendarCheck, ArrowUpRight } from 'lucide-react'
import { DEMO_CLINICS, PLATFORM_KPIS } from '@/lib/demo/admin'
import { formatCurrency, cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Super Admin' }
export const dynamic = 'force-dynamic'

const planTone: Record<string, string> = {
  Premium: 'bg-accent text-accent-foreground',
  Membro: 'bg-sky-50 text-sky-700',
  Essencial: 'bg-emerald-50 text-emerald-700',
  Trial: 'bg-amber-50 text-amber-700',
}

export default function AdminOverview() {
  const planDist = ['Premium', 'Membro', 'Essencial', 'Trial'].map((p) => ({
    plan: p,
    count: DEMO_CLINICS.filter((c) => c.plan === p).length,
  }))
  const maxCount = Math.max(...planDist.map((p) => p.count))

  const kpis = [
    { label: 'Empresas ativas', value: `${PLATFORM_KPIS.activeWorkspaces}/${PLATFORM_KPIS.workspaces}`, icon: Building2 },
    { label: 'Receita mensal (MRR)', value: formatCurrency(PLATFORM_KPIS.mrr), icon: DollarSign },
    { label: 'Usuários totais', value: String(PLATFORM_KPIS.users), icon: Users },
    { label: 'Agendamentos (mês)', value: '1.284', icon: CalendarCheck },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Visão geral da plataforma</h1>
        <p className="mt-1 text-sm text-muted-foreground">Controle de todas as empresas, planos e faturamento.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-accent text-brand"><k.icon className="size-5" /></span>
              <ArrowUpRight className="size-4 text-emerald-500" />
            </div>
            <p className="mt-4 font-heading text-2xl font-semibold text-foreground">{k.value}</p>
            <p className="text-sm text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Empresas recentes */}
        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-heading text-base font-semibold text-foreground">Empresas</h2>
            <Link href="/admin/empresas" className="text-xs font-medium text-brand hover:underline">Ver todas</Link>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {DEMO_CLINICS.slice(0, 5).map((c) => (
                <tr key={c.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="size-8 shrink-0 rounded-lg" style={{ backgroundColor: c.color }} />
                      <div>
                        <p className="font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3"><span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', planTone[c.plan])}>{c.plan}</span></td>
                  <td className="hidden px-3 py-3 text-right text-muted-foreground sm:table-cell">{formatCurrency(c.mrr)}/mês</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Distribuição de planos */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="mb-4 font-heading text-base font-semibold text-foreground">Planos</h2>
          <div className="space-y-3">
            {planDist.map((p) => (
              <div key={p.plan}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">{p.plan}</span>
                  <span className="font-medium text-foreground">{p.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${(p.count / maxCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
