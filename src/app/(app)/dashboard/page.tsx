import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Sparkles, Users, FolderKanban, BadgeCheck, AlarmClock, Wallet, Target,
  ArrowUpRight, Clock, ChevronRight, Flame,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { mx, PROJECT_STATUS_META, PRIORITY_META, APPROVAL_STATUS_META } from '@/lib/demo/agency'
import { AtlasCopilot } from '@/components/dashboard/atlas-copilot'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { createClient } from '@/lib/supabase/server'
import type { Priority, ProjectStatus, ApprovalStatus } from '@/types/database'

export const metadata: Metadata = { title: 'Comando' }
export const dynamic = 'force-dynamic'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

const KIND_EMOJI: Record<string, string> = {
  reuniao: '🤝', entrega: '📦', gravacao: '🎬', call: '📞', interno: '🏢',
  consulta: '🤝', retorno: '📞', encaixe: '🤝', pessoal: '🏢',
}
const COLORS = ['#f2b23e', '#f0722a', '#38bdf8', '#a78bfa', '#34d399', '#fb7185']

interface Snapshot {
  firstName: string
  clientesAtivos: number; clientesTotal: number; mrr: number
  projetosAtivos: number
  projetosFoco: { id: string; name: string; clientName: string; status: ProjectStatus; priority: Priority; progress: number; deadline: string | null; late: boolean }[]
  aprovacoesPendentes: { id: string; title: string; clientName: string; status: ApprovalStatus; version: number }[]
  tarefasAtrasadas: number
  pipelineCount: number; pipelineValor: number
  agenda: { id: string; time: string; title: string; who: string; kind: string; memberName: string | null; memberColor: string | null }[]
  alertas: { id: string; title: string; body: string; href: string; dot: string }[]
}

async function loadSnapshot(): Promise<Snapshot | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const today = new Date().toISOString().split('T')[0]
    const [{ data: me }, { data: cls }, { data: prjs }, { data: apps }, { data: tks }, { data: lds }, { data: evs }, { data: mbs }] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),
      supabase.from('clients').select('id, full_name, extra'),
      supabase.from('projects').select('id, name, client_id, status, priority, progress, deadline').order('deadline', { ascending: true, nullsFirst: false }),
      supabase.from('approvals').select('id, title, client_id, status, version').order('created_at', { ascending: false }),
      supabase.from('op_tasks').select('id, status, due_date'),
      supabase.from('leads').select('id, value, stage'),
      supabase.from('events').select('id, starts_at, title, type, member_id, client_id').gte('starts_at', `${today}T00:00:00`).lte('starts_at', `${today}T23:59:59`).order('starts_at'),
      supabase.from('profiles').select('id, full_name, agenda_color').in('role', ['dono', 'membro']),
    ])

    const clientName = new Map((cls ?? []).map((c) => [c.id as string, (c.full_name as string) ?? '—']))
    const memberById = new Map((mbs ?? []).map((m, i) => [m.id as string, { name: (m.full_name as string) ?? '—', color: ((m.agenda_color as string | null) ?? COLORS[i % COLORS.length]) }]))

    let mrr = 0; let ativos = 0
    for (const c of cls ?? []) {
      const extra = (c.extra as Record<string, unknown> | null) ?? {}
      if (((extra.status as string) ?? 'ativo') === 'ativo') { ativos++; mrr += Number(extra.monthly) || 0 }
    }

    const projAtivos = (prjs ?? []).filter((p) => !['finalizado', 'pausado'].includes(p.status as string))
    const projetosFoco = projAtivos.slice(0, 4).map((p) => ({
      id: p.id as string,
      name: (p.name as string) ?? '—',
      clientName: clientName.get(p.client_id as string) ?? 'Interno',
      status: (p.status as ProjectStatus) ?? 'producao',
      priority: (p.priority as Priority) ?? 'media',
      progress: Number(p.progress) || 0,
      deadline: (p.deadline as string | null),
      late: !!p.deadline && (p.deadline as string) < today,
    }))

    const aprovPend = (apps ?? []).filter((a) => ['enviado', 'reenviado', 'alteracao'].includes(a.status as string))
    const tarefasAtrasadas = (tks ?? []).filter((t) => t.status !== 'concluido' && t.due_date && (t.due_date as string) < today).length
    const pipeline = (lds ?? []).filter((l) => ['proposta', 'negociacao'].includes(l.stage as string))
    const pipelineValor = pipeline.reduce((s, l) => s + (Number(l.value) || 0), 0)

    const agenda = (evs ?? []).map((e) => {
      const m = memberById.get(e.member_id as string)
      return {
        id: e.id as string,
        time: new Date(e.starts_at as string).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        title: (e.title as string) || 'Compromisso',
        who: clientName.get(e.client_id as string) ?? 'Interno',
        kind: (e.type as string) ?? 'reuniao',
        memberName: m?.name ?? null,
        memberColor: m?.color ?? null,
      }
    })

    const alertas: Snapshot['alertas'] = []
    if (tarefasAtrasadas > 0) alertas.push({ id: 'al1', title: `${tarefasAtrasadas} tarefa(s) atrasada(s)`, body: 'Passaram do prazo na Operação — redistribua ou renegocie.', href: '/operacao', dot: 'bg-rose-400' })
    if (aprovPend.length > 0) alertas.push({ id: 'al2', title: `${aprovPend.length} aprovações paradas`, body: 'Materiais aguardando o aval do cliente na Central.', href: '/aprovacoes', dot: 'bg-orange-400' })
    if (pipeline.length > 0) alertas.push({ id: 'al3', title: `${mx(pipelineValor)}/mês em negociação`, body: `${pipeline.length} lead(s) em proposta/negociação — hora de fechar.`, href: '/comercial', dot: 'bg-emerald-400' })
    if (!alertas.length) alertas.push({ id: 'al0', title: 'Operação em dia', body: 'Nada urgente agora. Que tal prospectar ou planejar conteúdo?', href: '/comercial', dot: 'bg-emerald-400' })

    return {
      firstName: ((me?.full_name as string) ?? 'Dono').split(' ')[0],
      clientesAtivos: ativos,
      clientesTotal: (cls ?? []).length,
      mrr,
      projetosAtivos: projAtivos.length,
      projetosFoco,
      aprovacoesPendentes: aprovPend.slice(0, 4).map((a) => ({ id: a.id as string, title: (a.title as string) ?? '—', clientName: clientName.get(a.client_id as string) ?? '—', status: (a.status as ApprovalStatus) ?? 'enviado', version: Number(a.version) || 1 })),
      tarefasAtrasadas,
      pipelineCount: pipeline.length,
      pipelineValor,
      agenda,
      alertas,
    }
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const s = await loadSnapshot()

  const dateLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

  if (!s) {
    // Sem sessão/conexão: estado neutro (o middleware já manda pro /login em produção)
    return (
      <div className="mx-auto max-w-6xl py-20 text-center">
        <p className="kicker text-brand">Comando</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-foreground">Conectando ao seu workspace…</h1>
        <p className="mt-2 text-sm text-muted-foreground">Se esta tela persistir, <Link href="/login" className="text-brand underline">entre novamente</Link>.</p>
      </div>
    )
  }

  const kpis = [
    { label: 'Clientes ativos',   value: String(s.clientesAtivos), sub: `${s.clientesTotal} no total`, icon: Users,        href: '/clientes',   tone: 'text-foreground' },
    { label: 'Projetos ativos',   value: String(s.projetosAtivos), sub: 'em andamento',                icon: FolderKanban, href: '/projetos',   tone: 'text-foreground' },
    { label: 'Aprovações',        value: String(s.aprovacoesPendentes.length), sub: 'aguardando ação', icon: BadgeCheck,   href: '/aprovacoes', tone: 'text-sky-300' },
    { label: 'Tarefas atrasadas', value: String(s.tarefasAtrasadas), sub: s.tarefasAtrasadas ? 'precisam de você' : 'em dia', icon: AlarmClock, href: '/operacao', tone: s.tarefasAtrasadas ? 'text-rose-300' : 'text-emerald-300' },
    { label: 'Receita prevista',  value: mx(s.mrr), sub: 'contratos / mês',   icon: Wallet, href: '/financeiro', tone: 'text-brand', big: true },
    { label: 'Pipeline aberto',   value: mx(s.pipelineValor), sub: `${s.pipelineCount} em negociação`, icon: Target, href: '/comercial', tone: 'text-emerald-300', big: true },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Header editorial */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-brand">Comando</p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">
            {greeting()}, {s.firstName}.
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

      {/* Briefing do Atlas */}
      <AtlasBriefing
        name={s.firstName}
        reunioes={s.agenda.length}
        aprovacoes={s.aprovacoesPendentes.length}
        atrasadas={s.tarefasAtrasadas}
      />

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className="group animate-rise relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand/30">
            <div className="flex items-center justify-between">
              <span className="grid size-9 place-items-center rounded-xl bg-secondary text-muted-foreground">
                <k.icon className="size-[18px]" />
              </span>
              <ArrowUpRight className="size-4 text-muted-foreground/30 transition-colors group-hover:text-brand" />
            </div>
            <p className={cn('mt-4 font-display font-extrabold tracking-tight tabular', k.big ? 'text-2xl' : 'text-3xl', k.tone)}>{k.value}</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">{k.label}</p>
            <p className="text-xs text-muted-foreground">{k.sub}</p>
          </Link>
        ))}
      </div>

      {/* Corpo */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Agenda do dia */}
          <Panel title="Agenda do dia" kicker="Equipe" href="/agenda" hrefLabel="Abrir agenda">
            {s.agenda.length === 0 ? (
              <Empty text="Nenhum compromisso hoje." action="/agenda" actionLabel="Agendar algo" />
            ) : (
              <ul className="divide-y divide-border">
                {s.agenda.map((a) => (
                  <li key={a.id} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-white/[0.02]">
                    <span className="w-12 font-mono text-sm font-semibold text-brand tabular">{a.time}</span>
                    <span className="text-base">{KIND_EMOJI[a.kind] ?? '🗓️'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.who}</p>
                    </div>
                    {a.memberName && (
                      <span title={a.memberName} className="grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold text-black" style={{ backgroundColor: a.memberColor ?? '#f2b23e' }}>
                        {getInitials(a.memberName)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Projetos em foco */}
          <Panel title="Projetos em foco" kicker="Produção" href="/projetos" hrefLabel="Ver todos">
            {s.projetosFoco.length === 0 ? (
              <Empty text="Nenhum projeto ativo ainda." action="/projetos" actionLabel="Criar primeiro projeto" />
            ) : (
              <ul className="divide-y divide-border">
                {s.projetosFoco.map((p) => {
                  const meta = PROJECT_STATUS_META[p.status]
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
                          <p className="text-xs text-muted-foreground">{p.clientName}</p>
                        </div>
                        <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium', meta.chip)}>{meta.label}</span>
                      </div>
                      <div className="mt-2.5 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                          <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="w-9 text-right font-mono text-[11px] text-muted-foreground tabular">{p.progress}%</span>
                        {p.deadline && (
                          <span className={cn('inline-flex items-center gap-1 text-[11px]', p.late ? 'text-rose-300' : 'text-muted-foreground')}>
                            <Clock className="size-3" />
                            {new Date(`${p.deadline}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>
        </div>

        {/* Coluna direita */}
        <div className="space-y-6">
          <Panel title="Aprovações" kicker="Aguardando" href="/aprovacoes" hrefLabel="Central">
            {s.aprovacoesPendentes.length === 0 ? (
              <Empty text="Nada aguardando aprovação." action="/aprovacoes" actionLabel="Enviar material" />
            ) : (
              <ul className="divide-y divide-border">
                {s.aprovacoesPendentes.map((a) => {
                  const meta = APPROVAL_STATUS_META[a.status]
                  return (
                    <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                      <span className={cn('size-2 shrink-0 rounded-full', meta.dot)} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{a.clientName} · v{a.version}</p>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground/40" />
                    </li>
                  )
                })}
              </ul>
            )}
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
              {s.alertas.map((al) => (
                <li key={al.id}>
                  <Link href={al.href} className="block px-5 py-3 transition-colors hover:bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <span className={cn('size-1.5 rounded-full', al.dot)} />
                      <p className="text-xs font-semibold text-foreground">{al.title}</p>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{al.body}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className="pt-2 text-center text-[11px] text-muted-foreground/50">
        Ginga Studio OS · desenvolvido por GRP Tecnologia
      </p>

      <AtlasCopilot
        name={s.firstName}
        stats={{
          reunioes: s.agenda.length,
          aprovacoes: s.aprovacoesPendentes.length,
          atrasadas: s.tarefasAtrasadas,
          semContato: 0,
        }}
      />
    </div>
  )
}

function AtlasBriefing({ name, reunioes, aprovacoes, atrasadas }: { name: string; reunioes: number; aprovacoes: number; atrasadas: number }) {
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
            {greeting()}, {name}. A agência tem <b className="text-foreground">{reunioes} compromisso{reunioes === 1 ? '' : 's'}</b> hoje,{' '}
            <b className="text-sky-300">{aprovacoes} aprovaç{aprovacoes === 1 ? 'ão' : 'ões'}</b> aguardando ação e{' '}
            <b className={atrasadas ? 'text-rose-300' : 'text-emerald-300'}>{atrasadas} tarefa{atrasadas === 1 ? '' : 's'} atrasada{atrasadas === 1 ? '' : 's'}</b>.
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

function Panel({ title, kicker, href, hrefLabel, children }: { title: string; kicker: string; href: string; hrefLabel: string; children: React.ReactNode }) {
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

function Empty({ text, action, actionLabel }: { text: string; action: string; actionLabel: string }) {
  return (
    <div className="px-5 py-8 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      <Link href={action} className="mt-2 inline-block text-xs font-semibold text-brand hover:underline">{actionLabel} →</Link>
    </div>
  )
}
