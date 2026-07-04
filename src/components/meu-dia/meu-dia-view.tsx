'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, Circle, Clock, CalendarDays, BadgeCheck, Flame, ArrowRight, PartyPopper,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  GINGA_TASKS, GINGA_AGENDA, GINGA_APPROVALS, GINGA_PROJECTS,
  clientOf, demoToday, isLate,
  PRIORITY_META, OP_STATUS_META, OP_TYPE_META, APPROVAL_STATUS_META, APPROVAL_TYPE_META,
} from '@/lib/demo/agency'

const KIND_META: Record<string, { emoji: string; label: string }> = {
  reuniao:  { emoji: '🤝', label: 'Reunião' },
  entrega:  { emoji: '📦', label: 'Entrega' },
  gravacao: { emoji: '🎬', label: 'Gravação' },
  call:     { emoji: '📞', label: 'Call' },
  interno:  { emoji: '⚙️', label: 'Interno' },
}

function dueLabel(due: string): { text: string; tone: string } {
  const today = demoToday()
  if (due < today) return { text: 'Atrasada', tone: 'text-rose-300' }
  if (due === today) return { text: 'Hoje', tone: 'text-amber-300' }
  const d = Math.round((new Date(due).getTime() - new Date(today).getTime()) / 86400000)
  return { text: `em ${d}d`, tone: 'text-muted-foreground' }
}

export function MeuDiaView({ name, memberId }: { name: string; memberId: string }) {
  const firstName = name.split(' ')[0]
  const hour = new Date().getHours()
  const saud = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  const myProjectIds = useMemo(
    () => GINGA_PROJECTS.filter((p) => p.leadId === memberId || p.teamIds.includes(memberId)).map((p) => p.id),
    [memberId],
  )
  const baseTasks = useMemo(() => GINGA_TASKS.filter((t) => t.memberId === memberId), [memberId])
  const agenda = useMemo(() => GINGA_AGENDA.filter((a) => a.memberId === memberId), [memberId])
  const approvals = useMemo(
    () => GINGA_APPROVALS.filter((a) => a.projectId && myProjectIds.includes(a.projectId) && a.status !== 'aprovado' && a.status !== 'finalizado'),
    [myProjectIds],
  )

  // estado local de conclusão (marca como feito na hora)
  const [done, setDone] = useState<Record<string, boolean>>(
    Object.fromEntries(baseTasks.filter((t) => t.status === 'concluido').map((t) => [t.id, true])),
  )
  const toggle = (id: string) => setDone((d) => ({ ...d, [id]: !d[id] }))

  const tasks = useMemo(
    () => [...baseTasks].sort((a, b) => {
      const da = done[a.id] ? 1 : 0, db = done[b.id] ? 1 : 0
      if (da !== db) return da - db
      return a.due.localeCompare(b.due)
    }),
    [baseTasks, done],
  )

  const total = baseTasks.length
  const feitas = baseTasks.filter((t) => done[t.id]).length
  const atrasadas = baseTasks.filter((t) => !done[t.id] && isLate(t.due)).length
  const pct = total ? Math.round((feitas / total) * 100) : 0

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Saudação */}
      <header className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card to-background p-6 shadow-card">
        <p className="kicker text-brand">{hoje}</p>
        <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">
          {saud}, {firstName}. <span className="text-brand">Bora girar? 🌀</span>
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {atrasadas > 0
            ? <>Você tem <b className="text-rose-300">{atrasadas} tarefa{atrasadas > 1 ? 's' : ''} atrasada{atrasadas > 1 ? 's' : ''}</b> — vamos limpar isso primeiro.</>
            : feitas === total && total > 0
              ? <>Tudo em dia por aqui. Você é fera! 🔥</>
              : <>{total - feitas} tarefa{total - feitas !== 1 ? 's' : ''} no seu foco de hoje. Uma de cada vez.</>}
        </p>
        {/* barra de progresso do dia */}
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-brand-gradient transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="font-display text-sm font-bold text-foreground tabular">{feitas}/{total}</span>
        </div>
      </header>

      {/* Focos */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={Flame} label="Foco de hoje" value={String(total - feitas)} tone="text-brand" />
        <Stat icon={Clock} label="Atrasadas" value={String(atrasadas)} tone={atrasadas ? 'text-rose-300' : 'text-foreground'} />
        <Stat icon={BadgeCheck} label="Aprovações pendentes" value={String(approvals.length)} tone="text-sky-300" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Minhas tarefas */}
        <section className="lg:col-span-3">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-foreground">
            <Flame className="size-5 text-brand" /> Minhas tarefas
          </h2>
          <div className="space-y-2">
            {tasks.map((t) => {
              const isDone = !!done[t.id]
              const c = clientOf(t.clientId)
              const dl = dueLabel(t.due)
              const type = OP_TYPE_META[t.type]
              return (
                <button
                  key={t.id}
                  onClick={() => toggle(t.id)}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all',
                    isDone ? 'border-border bg-card/40 opacity-60' : 'border-border bg-card shadow-card hover:border-brand/30',
                  )}
                >
                  {isDone
                    ? <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
                    : <Circle className="size-5 shrink-0 text-muted-foreground/40 group-hover:text-brand" />}
                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate text-sm font-medium', isDone ? 'text-muted-foreground line-through' : 'text-foreground')}>
                      <span className="mr-1">{type.emoji}</span>{t.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{c?.name} · {OP_STATUS_META[t.status].label}</p>
                  </div>
                  {!isDone && (
                    <>
                      <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', PRIORITY_META[t.priority].chip)}>
                        <span className={cn('size-1.5 rounded-full', PRIORITY_META[t.priority].dot)} />{PRIORITY_META[t.priority].label}
                      </span>
                      <span className={cn('w-14 shrink-0 text-right text-xs font-semibold', dl.tone)}>{dl.text}</span>
                    </>
                  )}
                </button>
              )
            })}
            {total === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                <PartyPopper className="mx-auto mb-2 size-6 text-brand" /> Nenhuma tarefa atribuída. Aproveite! 🎉
              </div>
            )}
          </div>
        </section>

        {/* Agenda + aprovações */}
        <div className="space-y-6 lg:col-span-2">
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-foreground">
              <CalendarDays className="size-5 text-brand" /> Minha agenda
            </h2>
            <div className="space-y-2">
              {agenda.map((a) => {
                const k = KIND_META[a.kind] ?? KIND_META.interno
                const c = clientOf(a.clientId)
                return (
                  <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card">
                    <span className="font-mono text-sm font-bold text-brand tabular">{a.time}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{k.emoji} {a.title}</p>
                      {c && <p className="truncate text-xs text-muted-foreground">{c.name}</p>}
                    </div>
                  </div>
                )
              })}
              {agenda.length === 0 && (
                <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Agenda livre hoje.</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-foreground">
              <BadgeCheck className="size-5 text-brand" /> Aprovações
            </h2>
            <div className="space-y-2">
              {approvals.map((a) => {
                const c = clientOf(a.clientId)
                const st = APPROVAL_STATUS_META[a.status]
                return (
                  <Link key={a.id} href="/aprovacoes" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card transition-colors hover:border-brand/30">
                    <span className="text-xl">{APPROVAL_TYPE_META[a.type].emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{c?.name} · v{a.version}</p>
                    </div>
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', st.chip)}>
                      <span className={cn('size-1.5 rounded-full', st.dot)} />{st.label}
                    </span>
                  </Link>
                )
              })}
              {approvals.length === 0 && (
                <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nada aguardando você. ✅</p>
              )}
            </div>
            <Link href="/operacao" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:gap-2 transition-all">
              Ver quadro completo <ArrowRight className="size-3.5" />
            </Link>
          </section>
        </div>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Flame; label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary"><Icon className={cn('size-5', tone)} /></span>
      <div>
        <p className="kicker text-muted-foreground/50">{label}</p>
        <p className={cn('font-display text-xl font-extrabold tabular', tone)}>{value}</p>
      </div>
    </div>
  )
}
