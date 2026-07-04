import type { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp, Sparkles, ArrowUpRight, Award, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GINGA_CLIENTS, GINGA_ALERTS, ATLAS_SEVERITY_META, mx } from '@/lib/demo/agency'

export const metadata: Metadata = { title: 'Growth' }
export const dynamic = 'force-dynamic'

export default function GrowthPage() {
  const oportunidades = GINGA_ALERTS.filter((a) => ['oportunidade', 'atencao'].includes(a.severity)
    && ['upsell', 'cliente_sem_contato', 'proposta_parada'].includes(a.kind))

  const maisLucrativos = [...GINGA_CLIENTS.filter((c) => c.status === 'ativo')]
    .sort((a, b) => b.monthly - a.monthly).slice(0, 5)

  const semCampanha = GINGA_CLIENTS.filter((c) => c.status === 'pausado' || c.lastContactDays >= 14)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="kicker text-brand">Growth Center</p>
        <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">Oportunidades de crescimento</h1>
        <p className="mt-1 text-sm text-muted-foreground">Onde a Ginga pode faturar mais — o Atlas encontra, você fecha.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Oportunidades */}
        <div className="space-y-3 lg:col-span-2">
          <p className="kicker flex items-center gap-1.5 text-brand"><Zap className="size-3.5" /> Sugeridas pelo Atlas</p>
          {oportunidades.map((o) => {
            const sev = ATLAS_SEVERITY_META[o.severity]
            return (
              <Link key={o.id} href={o.href ?? '#'} className={cn('group flex items-start gap-4 rounded-2xl border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5', o.severity === 'oportunidade' ? 'border-emerald-500/25' : 'border-border hover:border-brand/30')}>
                <span className={cn('mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ring-1', sev.ring, o.severity === 'oportunidade' ? 'bg-emerald-500/10' : 'bg-secondary')}>
                  {o.severity === 'oportunidade' ? <TrendingUp className="size-4 text-emerald-300" /> : <Sparkles className="size-4 text-amber-300" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{o.title}</p>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', sev.chip)}>{o.entity}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{o.body}</p>
                </div>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-brand" />
              </Link>
            )
          })}

          {semCampanha.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <p className="kicker text-muted-foreground/50">Clientes sem campanha ativa</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {semCampanha.map((c) => (
                  <span key={c.id} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground">
                    {c.name} <span className="text-muted-foreground/60">· {c.lastContactDays}d</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ranking */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="kicker flex items-center gap-1.5 text-muted-foreground/50"><Award className="size-3.5" /> Mais lucrativos</p>
          <ul className="mt-3 space-y-2.5">
            {maisLucrativos.map((c, i) => (
              <li key={c.id} className="flex items-center gap-3">
                <span className={cn('grid size-6 shrink-0 place-items-center rounded-lg font-display text-xs font-bold', i === 0 ? 'bg-brand text-brand-foreground' : 'bg-secondary text-muted-foreground')}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">{c.segment}</p>
                </div>
                <span className="font-display text-sm font-bold text-foreground tabular">{mx(c.monthly)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
