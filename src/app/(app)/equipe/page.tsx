import type { Metadata } from 'next'
import { cn } from '@/lib/utils'
import { GINGA_TEAM, GINGA_TASKS } from '@/lib/demo/agency'
import { ConvidarColaborador } from '@/components/equipe/convidar-colaborador'

export const metadata: Metadata = { title: 'Equipe' }
export const dynamic = 'force-dynamic'

export default function EquipePage() {
  const online = GINGA_TEAM.filter((m) => m.online).length

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-brand">Time</p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">Equipe</h1>
          <p className="mt-1 text-sm text-muted-foreground">{GINGA_TEAM.length} pessoas · {online} online agora.</p>
        </div>
        <ConvidarColaborador />
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GINGA_TEAM.map((m) => {
          const tarefas = GINGA_TASKS.filter((t) => t.memberId === m.id && t.status !== 'concluido').length
          const sobrecarga = tarefas >= 3
          return (
            <div key={m.id} className="animate-rise rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:border-brand/30">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="grid size-12 place-items-center rounded-2xl font-display text-base font-extrabold text-black" style={{ backgroundColor: m.color }}>{m.initials}</span>
                  <span className={cn('absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full ring-2 ring-card', m.online ? 'bg-emerald-400' : 'bg-zinc-500')} title={m.online ? 'Online' : 'Offline'} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-display text-[15px] font-bold text-foreground">{m.name}</p>
                    {m.owner && <span className="shrink-0 rounded-full bg-brand/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand">Dono</span>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{m.role}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <div>
                  <p className={cn('font-display text-lg font-extrabold tabular', sobrecarga ? 'text-amber-300' : 'text-foreground')}>{tarefas}</p>
                  <p className="kicker text-muted-foreground/50">tarefas ativas</p>
                </div>
                {sobrecarga
                  ? <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-medium text-amber-300">Sobrecarregado</span>
                  : <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-medium text-emerald-300">Tranquilo</span>}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground/60">
        O Atlas monitora a carga da equipe e avisa quando alguém está sobrecarregado — pra você redistribuir a tempo.
      </p>
    </div>
  )
}
