import type { Metadata } from 'next'
import Link from 'next/link'
import { Clock, Users, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  GINGA_PROJECTS, PROJECT_STATUS_META, PRIORITY_META, clientOf, memberOf, isLate,
} from '@/lib/demo/agency'

export const metadata: Metadata = { title: 'Projetos' }
export const dynamic = 'force-dynamic'

export default function ProjetosPage() {
  const ativos = GINGA_PROJECTS.filter((p) => !['finalizado', 'pausado'].includes(p.status))
  const projetos = [...GINGA_PROJECTS].sort((a, b) => a.deadline.localeCompare(b.deadline))

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-brand">Produção</p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">Projetos</h1>
          <p className="mt-1 text-sm text-muted-foreground">{ativos.length} projetos ativos · cliente, equipe, prazo e progresso num lugar só.</p>
        </div>
        <Link href="#" className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-gold">
          Novo projeto
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projetos.map((p) => {
          const c = clientOf(p.clientId)
          const meta = PROJECT_STATUS_META[p.status]
          const late = isLate(p.deadline) && !['finalizado', 'aprovado'].includes(p.status)
          return (
            <Link key={p.id} href={`/projetos/${p.id}`} className={cn('group animate-rise flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand/30', p.status === 'pausado' && 'opacity-70')}>
              <div className="flex items-start justify-between gap-2">
                <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', meta.chip)}>{meta.label}</span>
                <span className="flex items-center gap-2">
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', PRIORITY_META[p.priority].chip)}>{PRIORITY_META[p.priority].label}</span>
                  <ArrowUpRight className="size-4 text-muted-foreground/30 transition-colors group-hover:text-brand" />
                </span>
              </div>
              <h3 className="mt-3 font-display text-lg font-bold leading-tight text-foreground">{p.name}</h3>
              <p className="text-xs text-muted-foreground">{c?.name} · {c?.segment}</p>
              <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground/80">{p.description}</p>

              <div className="mt-4 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${p.progress}%` }} />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground tabular">{p.progress}%</span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <div className="flex -space-x-1.5">
                  {p.teamIds.map((id) => {
                    const m = memberOf(id)
                    return m ? (
                      <span key={id} title={m.name} className="grid size-6 place-items-center rounded-full text-[9px] font-bold text-black ring-2 ring-card" style={{ backgroundColor: m.color }}>{m.initials}</span>
                    ) : null
                  })}
                </div>
                <span className={cn('inline-flex items-center gap-1 text-[11px]', late ? 'text-rose-300' : 'text-muted-foreground')}>
                  <Clock className="size-3" />
                  {new Date(`${p.deadline}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
              </div>
            </Link>
          )
        })}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
        <Users className="size-3.5" /> Clique num projeto para abrir etapas, tarefas, arquivos, equipe e tempo gasto.
      </p>
    </div>
  )
}
