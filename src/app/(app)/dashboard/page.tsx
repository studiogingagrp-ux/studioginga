import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Sparkles, Users, FolderKanban, BadgeCheck, AlarmClock, Wallet, Target,
  ArrowUpRight, Clock, ChevronRight, Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  GINGA_CLIENTS, GINGA_PROJECTS, GINGA_APPROVALS, GINGA_TASKS, GINGA_LEADS,
  GINGA_AGENDA, GINGA_ALERTS, mx, memberOf, clientOf,
  PROJECT_STATUS_META, PRIORITY_META, APPROVAL_STATUS_META, ATLAS_SEVERITY_META,
  isLate,
} from '@/lib/demo/agency'

export const metadata: Metadata = { title: 'Comando' }
export const dynamic = 'force-dynamic'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

const KIND_EMOJI: Record<string, string> = {
  reuniao: '🤝', entrega: '📦', gravacao: '🎬', call: '📞', interno: '🏢',
}

export default function DashboardPage() {
  const clientesAtivos = GINGA_CLIENTS.filter((c) => c.status === 'ativo')
  const projetosAtivos = GINGA_PROJECTS.filter((p) => !['finalizado', 'pausado'].includes(p.status))
  const aprovacoesPendentes = GINGA_APPROVALS.filter((a) => a.status === 'enviado' || a.status === 'reenviado' || a.status === 'alteracao')
  const tarefasAtrasadas = GINGA_TASKS.filter((t) => t.status !== 'concluido' && isLate(t.due))
  const mrr = clientesAtivos.reduce((s, c) => s + c.monthly, 0)
  const pipeline = GINGA_LEADS.filter((l) => l.stage === 'proposta' || l.stage === 'negociacao')
  const pipelineValor = pipeline.reduce((s, l) => s + l.value, 0)
  const semContato = GINGA_CLIENTS.filter((c) => c.lastContactDays >= 14)
  const alertasUrgentes = GINGA_ALERTS.filter((a) => a.severity === 'urgente')

  const projetosFoco = [...projetosAtivos]
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 4)

  const kpis = [
    { label: 'Clientes ativos',    value: String(clientesAtivos.length), sub: `${GINGA_CLIENTS.length} no total`, icon: Users,       href: '/clientes',   tone: 'text-foreground' },
    { label: 'Projetos ativos',    value: String(projetosAtivos.length), sub: 'em andamento',                    icon: FolderKanban, href: '/projetos',   tone: 'text-foreground' },
    { label: 'Aprovações',         value: String(aprovacoesPendentes.length), sub: 'aguardando ação',            icon: BadgeCheck,   href: '/aprovacoes', tone: 'text-sky-300' },
    { label: 'Tarefas atrasadas',  value: String(tarefasAtrasadas.length), sub: tarefasAtrasadas.length ? 'precisam de você' : 'em dia', icon: AlarmClock, href: '/operacao', tone: tarefasAtrasadas.length ? 'text-rose-300' : 'text-emerald-300' },
    { label: 'Receita prevista',   value: mx(mrr), sub: 'contratos / mês', icon: Wallet,  href: '/financeiro', tone: 'text-brand', big: true },
    { label: 'Pipeline aberto',    value: mx(pipelineValor), sub: `${pipeline.length} propostas`, icon: Target, href: '/comercial', tone: 'text-emerald-300', big: true },
  ]

  const dateLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    .format(new Date())

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Header editorial */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-brand">Comando</p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">
            {greeting()}, Estevam.
          </h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground">{dateLabel} · Ginga Studio</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/operacao" className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
            Nova tarefa
          </Link>
          <Link href="/projetos" className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.02] active:scale-95">
            <FolderKanban className="size-4" /> Novo projeto
          </Link>
        </div>
      </div>

      {/* Briefing do Atlas — o cérebro */}
      <AtlasBriefing
        reunioes={GINGA_AGENDA.length}
        aprovacoes={aprovacoesPendentes.length}
        atrasadas={tarefasAtrasadas.length}
        semContato={semContato.length}
        urgente={alertasUrgentes[0]?.body ?? null}
      />

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className="group animate-rise relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand/30"
          >
            <div className="flex items-center justify-between">
              <span className="grid size-9 place-items-center rounded-xl bg-secondary text-muted-foreground">
                <k.icon className="size-[18px]" />
              </span>
              <ArrowUpRight className="size-4 text-muted-foreground/30 transition-colors group-hover:text-brand" />
            </div>
            <p className={cn('mt-4 font-display font-extrabold tracking-tight tabular', k.big ? 'text-2xl' : 'text-3xl', k.tone)}>
              {k.value}
            </p>
            <p className="mt-0.5 text-sm font-medium text-foreground">{k.label}</p>
            <p className="text-xs text-muted-foreground">{k.sub}</p>
          </Link>
        ))}
      </div>

      {/* Corpo — agenda + projetos | aprovações + alertas */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Agenda do dia */}
          <Panel title="Agenda do dia" kicker="Equipe" href="/agenda" hrefLabel="Abrir agenda">
            <ul className="divide-y divide-border">
              {GINGA_AGENDA.map((a) => {
                const m = memberOf(a.memberId)
                const c = clientOf(a.clientId)
                return (
                  <li key={a.id} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-white/[0.02]">
                    <span className="w-12 font-mono text-sm font-semibold text-brand tabular">{a.time}</span>
                    <span className="text-base">{KIND_EMOJI[a.kind]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{c ? c.name : 'Interno'}</p>
                    </div>
                    {m && (
                      <span title={m.name} className="grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold text-black" style={{ backgroundColor: m.color }}>
                        {m.initials}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </Panel>

          {/* Projetos em foco */}
          <Panel title="Projetos em foco" kicker="Produção" href="/projetos" hrefLabel="Ver todos">
            <ul className="divide-y divide-border">
              {projetosFoco.map((p) => {
                const c = clientOf(p.clientId)
                const meta = PROJECT_STATUS_META[p.status]
                const late = isLate(p.deadline)
                return (
                  <li key={p.id} className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                          <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium', PRIORITY_META[p.priority].chip)}>
                            {PRIORITY_META[p.priority].label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{c?.name}</p>
                      </div>
                      <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium', meta.chip)}>{meta.label}</span>
                    </div>
                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="w-9 text-right font-mono text-[11px] text-muted-foreground tabular">{p.progress}%</span>
                      <span className={cn('inline-flex items-center gap-1 text-[11px]', late ? 'text-rose-300' : 'text-muted-foreground')}>
                        <Clock className="size-3" />
                        {new Date(`${p.deadline}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </Panel>
        </div>

        {/* Coluna direita */}
        <div className="space-y-6">
          {/* Aprovações aguardando */}
          <Panel title="Aprovações" kicker="Aguardando" href="/aprovacoes" hrefLabel="Central">
            <ul className="divide-y divide-border">
              {aprovacoesPendentes.slice(0, 4).map((a) => {
                const c = clientOf(a.clientId)
                const meta = APPROVAL_STATUS_META[a.status]
                return (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                    <span className={cn('size-2 shrink-0 rounded-full', meta.dot)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{c?.name} · v{a.version}</p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground/40" />
                  </li>
                )
              })}
            </ul>
          </Panel>

          {/* Alertas do Atlas */}
          <div className="overflow-hidden rounded-2xl border border-brand/25 bg-card shadow-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-brand" />
                <h2 className="font-display text-sm font-bold text-foreground">Alertas do Atlas</h2>
              </div>
              <Link href="/atlas" className="kicker text-brand hover:underline">Ver tudo</Link>
            </div>
            <ul className="divide-y divide-border">
              {GINGA_ALERTS.slice(0, 3).map((al) => {
                const sev = ATLAS_SEVERITY_META[al.severity]
                return (
                  <li key={al.id}>
                    <Link href={al.href ?? '/atlas'} className="block px-5 py-3 transition-colors hover:bg-white/[0.02]">
                      <div className="flex items-center gap-2">
                        <span className={cn('size-1.5 rounded-full', sev.dot)} />
                        <p className="text-xs font-semibold text-foreground">{al.title}</p>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{al.body}</p>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>

      <p className="pt-2 text-center text-[11px] text-muted-foreground/50">
        Ginga Studio OS · dados de demonstração · powered by Atlas · GRP Tecnologia
      </p>
    </div>
  )
}

function AtlasBriefing({
  reunioes, aprovacoes, atrasadas, semContato, urgente,
}: {
  reunioes: number; aprovacoes: number; atrasadas: number; semContato: number; urgente: string | null
}) {
  return (
    <div className="animate-rise relative overflow-hidden rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/[0.08] via-card to-card p-5 shadow-card sm:p-6">
      <div aria-hidden className="ginga-glow pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient shadow-gold animate-pulse-gold">
          <Sparkles className="size-5 text-brand-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="kicker text-brand">Briefing do Atlas</p>
            <span className="relative flex size-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-70" /><span className="relative inline-flex size-1.5 rounded-full bg-brand" /></span>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground/90">
            Bom dia, Estevam. A agência tem <b className="text-foreground">{reunioes} compromissos</b> hoje,{' '}
            <b className="text-sky-300">{aprovacoes} aprovações</b> aguardando ação e{' '}
            <b className={atrasadas ? 'text-rose-300' : 'text-emerald-300'}>{atrasadas} tarefas atrasadas</b>.
            {semContato > 0 && <> Há <b className="text-amber-300">{semContato} cliente</b> sem contato recente.</>}
            {urgente && <> <span className="text-muted-foreground">{urgente}</span></>}
          </p>
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <Link href="/atlas" className="inline-flex items-center gap-1.5 rounded-xl bg-brand-gradient px-3.5 py-2 text-xs font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.02] active:scale-95">
              <Sparkles className="size-3.5" /> Falar com o Atlas
            </Link>
            <Link href="/aprovacoes" className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-card">
              <Flame className="size-3.5 text-brand" /> Resolver aprovações
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Panel({
  title, kicker, href, hrefLabel, children,
}: {
  title: string; kicker: string; href: string; hrefLabel: string; children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div>
          <p className="kicker text-muted-foreground/50">{kicker}</p>
          <h2 className="mt-0.5 font-display text-sm font-bold text-foreground">{title}</h2>
        </div>
        <Link href={href} className="text-xs font-medium text-brand hover:underline">{hrefLabel}</Link>
      </div>
      {children}
    </div>
  )
}
