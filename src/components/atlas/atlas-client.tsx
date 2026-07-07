'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Send, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mx } from '@/lib/demo/agency'

export interface AtlasAlert { id: string; severity: 'urgente' | 'atencao' | 'oportunidade' | 'info'; title: string; body: string; href?: string }
export interface AtlasSnapshot {
  firstName: string
  members: { name: string; openTasks: number }[]
  staleClients: { name: string; days: number }[]
  lateTasks: { title: string }[]
  pendingApprovals: { title: string }[]
  hotLeads: { company: string; value: number; stage: string }[]
  overdue: { desc: string; amount: number }[]
  totals: { clients: number; mrr: number; tasksOpen: number; leadsOpen: number }
  alerts: AtlasAlert[]
}

const SEV_META: Record<AtlasAlert['severity'], { label: string; chip: string; dot: string; ring: string }> = {
  urgente:      { label: 'Urgente',      chip: 'bg-rose-500/15 text-rose-300',     dot: 'bg-rose-400',    ring: 'ring-rose-500/20' },
  atencao:      { label: 'Atenção',      chip: 'bg-orange-500/15 text-orange-300', dot: 'bg-orange-400',  ring: 'ring-orange-500/15' },
  oportunidade: { label: 'Oportunidade', chip: 'bg-emerald-500/15 text-emerald-300', dot: 'bg-emerald-400', ring: 'ring-emerald-500/15' },
  info:         { label: 'Resumo',       chip: 'bg-sky-500/15 text-sky-300',       dot: 'bg-sky-400',     ring: 'ring-sky-500/10' },
}

const SUGESTOES = [
  'Quem está mais livre agora?',
  'Quais clientes estão parados?',
  'O que está atrasado?',
  'Quais aprovações estão pendentes?',
  'Onde está o dinheiro na rua?',
]

function responder(pergunta: string, s: AtlasSnapshot): string {
  const t = pergunta.toLowerCase()

  if (/dispon|quem est|livre|folga|sobrecarr|carga/.test(t)) {
    if (!s.members.length) return 'Ainda não há colaboradores cadastrados. Cadastre a equipe em /usuarios que eu passo a distribuir o trabalho.'
    const ord = [...s.members].sort((a, b) => a.openTasks - b.openTasks)
    const livre = ord.slice(0, 2).map((m) => `${m.name.split(' ')[0]} (${m.openTasks} tarefa${m.openTasks === 1 ? '' : 's'})`)
    const cheio = ord[ord.length - 1]
    return `Mais livres agora: ${livre.join(', ')}. ${cheio && cheio.openTasks > 0 ? `${cheio.name.split(' ')[0]} está com a maior carga (${cheio.openTasks}). ` : ''}Quer que eu redistribua alguma tarefa?`
  }
  if (/sem contato|parad|esquec|sumido|reativ|30 dias|frio/.test(t)) {
    if (!s.staleClients.length) return 'Nenhum cliente está parado — todos tiveram atividade recente. 👏'
    const list = s.staleClients.map((c) => `${c.name} (${c.days} dias)`)
    return `Clientes parados: ${list.join(', ')}. O ${s.staleClients[0].name} é o mais crítico — sugiro uma mensagem de reativação hoje. Quer que eu prepare o texto?`
  }
  if (/atrasad|atras|vencid|prazo|due/.test(t)) {
    if (!s.lateTasks.length) return 'Nada atrasado no momento — a operação está em dia. ✅'
    return `${s.lateTasks.length} item(ns) atrasado(s): ${s.lateTasks.map((x) => x.title).join('; ')}. Quer que eu avise os responsáveis?`
  }
  if (/aprova/.test(t)) {
    if (!s.pendingApprovals.length) return 'Nenhuma aprovação pendente — tudo aprovado ou publicado. 🎉'
    return `${s.pendingApprovals.length} aprovações aguardando o cliente: ${s.pendingApprovals.map((a) => a.title).join('; ')}.`
  }
  if (/dinheiro|rua|receb|inadimpl|financ|caixa|vencid.*receb/.test(t)) {
    if (!s.overdue.length) return `Nada vencido a receber. MRR atual: ${mx(s.totals.mrr)}. 💚`
    const tot = s.overdue.reduce((a, b) => a + b.amount, 0)
    return `Você tem ${mx(tot)} vencido a receber: ${s.overdue.map((o) => `${o.desc} (${mx(o.amount)})`).join('; ')}. Quer que eu prepare a cobrança?`
  }
  if (/lead|pipeline|vend|negoci|oportun|fechar/.test(t)) {
    if (!s.hotLeads.length) return 'Sem leads quentes no pipeline agora. Que tal prospectar? Posso sugerir um roteiro.'
    const tot = s.hotLeads.reduce((a, b) => a + b.value, 0)
    return `Leads mais quentes: ${s.hotLeads.map((l) => `${l.company} (${mx(l.value)}/mês)`).join('; ')} — ${mx(tot)}/mês em jogo. Foque neles esta semana.`
  }
  if (/resumo|panorama|como est|vis[aã]o|geral|hoje/.test(t)) {
    return `Panorama: ${s.totals.clients} clientes (${mx(s.totals.mrr)}/mês de MRR), ${s.totals.tasksOpen} tarefas abertas, ${s.pendingApprovals.length} aprovações pendentes e ${s.totals.leadsOpen} leads no pipeline. ${s.lateTasks.length ? `⚠️ ${s.lateTasks.length} atrasada(s).` : 'Tudo no prazo. ✅'}`
  }
  return 'Posso analisar equipe, clientes parados, atrasos, aprovações, pipeline e financeiro. Tente "o que está atrasado?" ou "onde está o dinheiro na rua?".'
}

type Msg = { from: 'user' | 'atlas'; text: string }

export function AtlasClient({ snapshot, isRealData }: { snapshot: AtlasSnapshot; isRealData?: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')

  function send(text: string) {
    const q = text.trim()
    if (!q) return
    setMsgs((m) => [...m, { from: 'user', text: q }, { from: 'atlas', text: responder(q, snapshot) }])
    setInput('')
  }

  const grouped = (['urgente', 'atencao', 'oportunidade', 'info'] as const)
    .flatMap((sev) => snapshot.alerts.filter((a) => a.severity === sev))

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-gradient shadow-gold animate-pulse-gold">
          <Sparkles className="size-5 text-brand-foreground" />
        </span>
        <div>
          <p className="kicker text-brand">Inteligência{!isRealData && ' · demo'}</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">Atlas</h1>
          <p className="text-sm text-muted-foreground">A gerente de operações da agência — lê os dados reais da Ginga.</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Chat */}
        <div className="lg:col-span-3">
          <div className="flex min-h-[380px] flex-col overflow-hidden rounded-2xl border border-brand/25 bg-card shadow-card">
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {msgs.length === 0 && (
                <div className="rounded-xl bg-white/[0.02] p-4 text-sm leading-relaxed text-muted-foreground">
                  <span className="text-foreground">Olá, {snapshot.firstName}.</span> Sou o Atlas. Já olhei sua operação:
                  {' '}<span className="text-foreground">{snapshot.totals.clients}</span> clientes,
                  {' '}<span className="text-foreground">{snapshot.totals.tasksOpen}</span> tarefas abertas
                  {snapshot.lateTasks.length ? <> e <span className="text-rose-300">{snapshot.lateTasks.length} atrasada(s)</span></> : ' — tudo no prazo'}.
                  {' '}Pergunte à vontade.
                </div>
              )}
              {msgs.map((m, i) => (
                <div key={i} className={cn('flex', m.from === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                    m.from === 'user' ? 'bg-brand-gradient text-brand-foreground' : 'border border-border bg-white/[0.03] text-foreground/90',
                  )}>
                    {m.from === 'atlas' && <span className="kicker mb-1 block text-brand">Atlas</span>}
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border p-3">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {SUGESTOES.map((sug) => (
                  <button key={sug} onClick={() => send(sug)} className="rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-brand/40 hover:text-foreground">
                    {sug}
                  </button>
                ))}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="flex items-center gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Pergunte ao Atlas…" className="h-11 flex-1 rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30" />
                <button type="submit" className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-gradient text-brand-foreground shadow-gold transition-transform hover:scale-[1.03] active:scale-95">
                  <Send className="size-4" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Alertas operacionais */}
        <div className="lg:col-span-2">
          <p className="kicker mb-2 text-muted-foreground/50">Alertas operacionais</p>
          <div className="space-y-2.5">
            {grouped.length === 0 && (
              <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">Nada urgente agora — operação tranquila. ✅</div>
            )}
            {grouped.map((al) => {
              const sev = SEV_META[al.severity]
              return (
                <Link key={al.id} href={al.href ?? '#'} className={cn('group block rounded-2xl border border-border bg-card p-4 shadow-soft ring-1 transition-all hover:-translate-y-0.5', sev.ring)}>
                  <div className="flex items-center justify-between">
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium', sev.chip)}>
                      <span className={cn('size-1.5 rounded-full', sev.dot)} /> {sev.label}
                    </span>
                    <ArrowUpRight className="size-3.5 text-muted-foreground/40 transition-colors group-hover:text-brand" />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-foreground">{al.title}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{al.body}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
