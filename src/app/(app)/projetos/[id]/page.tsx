import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft, Clock, FileText, Download, CheckCircle2, Circle, CalendarClock, Timer,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  GINGA_PROJECTS, GINGA_TASKS, GINGA_APPROVALS, GINGA_AGENDA,
  PROJECT_STATUS_META, PRIORITY_META, OP_STATUS_META, OP_TYPE_META,
  APPROVAL_STATUS_META, clientOf, memberOf, isLate,
} from '@/lib/demo/agency'

export const dynamic = 'force-dynamic'

const ETAPAS = ['Briefing', 'Planejamento', 'Produção', 'Revisão', 'Entrega']

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const p = GINGA_PROJECTS.find((x) => x.id === id)
  return { title: p?.name ?? 'Projeto' }
}

export default async function ProjetoDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = GINGA_PROJECTS.find((x) => x.id === id)
  if (!p) notFound()

  const c = clientOf(p.clientId)
  const meta = PROJECT_STATUS_META[p.status]
  const tasks = GINGA_TASKS.filter((t) => t.projectId === p.id)
  const approvals = GINGA_APPROVALS.filter((a) => a.projectId === p.id)
  const meetings = GINGA_AGENDA.filter((m) => m.clientId === p.clientId)
  const etapaAtual = Math.round((p.progress / 100) * ETAPAS.length)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/projetos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" /> Projetos
      </Link>

      {/* Header */}
      <header className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', meta.chip)}>{meta.label}</span>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', PRIORITY_META[p.priority].chip)}>{PRIORITY_META[p.priority].label}</span>
            </div>
            <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{p.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{c?.name} · {c?.segment}</p>
            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-muted-foreground/90">{p.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex -space-x-1.5">
              {p.teamIds.map((mid) => {
                const m = memberOf(mid)
                return m ? <span key={mid} title={m.name} className="grid size-8 place-items-center rounded-full text-[10px] font-bold text-black ring-2 ring-card" style={{ backgroundColor: m.color }}>{m.initials}</span> : null
              })}
            </div>
            <span className={cn('inline-flex items-center gap-1 text-xs', isLate(p.deadline) && !['finalizado', 'aprovado'].includes(p.status) ? 'text-rose-300' : 'text-muted-foreground')}>
              <Clock className="size-3.5" /> Entrega {new Date(`${p.deadline}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
            </span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${p.progress}%` }} />
          </div>
          <span className="font-display text-sm font-bold text-foreground tabular">{p.progress}%</span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Etapas */}
          <Panel title="Etapas" kicker="Fluxo">
            <ol className="px-5 py-4">
              {ETAPAS.map((et, i) => {
                const done = i < etapaAtual
                const current = i === etapaAtual
                return (
                  <li key={et} className="flex items-center gap-3 py-2">
                    {done ? <CheckCircle2 className="size-5 text-emerald-400" /> : <Circle className={cn('size-5', current ? 'text-brand' : 'text-muted-foreground/40')} />}
                    <span className={cn('text-sm', done ? 'text-muted-foreground line-through' : current ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{et}</span>
                    {current && <span className="ml-auto kicker text-brand">Agora</span>}
                  </li>
                )
              })}
            </ol>
          </Panel>

          {/* Tarefas vinculadas */}
          <Panel title="Tarefas" kicker={`${tasks.length} vinculadas`} href="/operacao" hrefLabel="Kanban">
            <ul className="divide-y divide-border">
              {tasks.map((t) => {
                const m = memberOf(t.memberId)
                const done = t.status === 'concluido'
                return (
                  <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                    <span className={cn('size-2 shrink-0 rounded-full', OP_STATUS_META[t.status].dot)} />
                    <div className="min-w-0 flex-1">
                      <p className={cn('truncate text-sm font-medium', done ? 'text-muted-foreground line-through' : 'text-foreground')}>{OP_TYPE_META[t.type].emoji} {t.title}</p>
                      <p className="text-xs text-muted-foreground">{OP_STATUS_META[t.status].label}</p>
                    </div>
                    {m && <span title={m.name} className="grid size-6 place-items-center rounded-full text-[10px] font-bold text-black" style={{ backgroundColor: m.color }}>{m.initials}</span>}
                  </li>
                )
              })}
              {tasks.length === 0 && <li className="px-5 py-6 text-center text-sm text-muted-foreground">Nenhuma tarefa vinculada ainda.</li>}
            </ul>
          </Panel>

          {/* Arquivos */}
          <Panel title="Arquivos" kicker="Materiais">
            <ul className="divide-y divide-border">
              {['Briefing aprovado.pdf', 'Referências visuais.zip', 'Roteiro v2.docx'].map((f) => (
                <li key={f} className="flex items-center gap-3 px-5 py-3">
                  <FileText className="size-4 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">{f}</span>
                  <Download className="size-4 text-muted-foreground transition-colors hover:text-brand" />
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* Coluna direita */}
        <div className="space-y-6">
          <Panel title="Aprovações" kicker="Deste projeto" href="/aprovacoes" hrefLabel="Central">
            <ul className="divide-y divide-border">
              {approvals.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <span className={cn('size-2 shrink-0 rounded-full', APPROVAL_STATUS_META[a.status].dot)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{APPROVAL_STATUS_META[a.status].label} · v{a.version}</p>
                  </div>
                </li>
              ))}
              {approvals.length === 0 && <li className="px-5 py-6 text-center text-sm text-muted-foreground">Nada enviado ainda.</li>}
            </ul>
          </Panel>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <p className="kicker flex items-center gap-1.5 text-muted-foreground/50"><Timer className="size-3.5" /> Tempo gasto</p>
            <p className="mt-2 font-display text-2xl font-extrabold text-foreground tabular">{18 + Number(p.id.replace(/\D/g, '')) * 3}h</p>
            <p className="text-xs text-muted-foreground">registradas pela equipe</p>
          </div>

          {meetings.length > 0 && (
            <Panel title="Reuniões" kicker="Do cliente" href="/agenda" hrefLabel="Agenda">
              <ul className="divide-y divide-border">
                {meetings.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                    <CalendarClock className="size-4 text-muted-foreground" />
                    <span className="w-11 font-mono text-xs text-brand tabular">{m.time}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">{m.title}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}

function Panel({
  title, kicker, href, hrefLabel, children,
}: {
  title: string; kicker: string; href?: string; hrefLabel?: string; children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div>
          <p className="kicker text-muted-foreground/50">{kicker}</p>
          <h2 className="mt-0.5 font-display text-sm font-bold text-foreground">{title}</h2>
        </div>
        {href && <Link href={href} className="text-xs font-medium text-brand hover:underline">{hrefLabel}</Link>}
      </div>
      {children}
    </div>
  )
}
