'use client'

import { useMemo, useState } from 'react'
import {
  Video, Plus, Check, Circle, Sparkles, Copy, MessageCircle, Clock, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { GINGA_TEAM, memberOf } from '@/lib/demo/agency'

interface AgendaItem { id: string; text: string; done: boolean }
interface ActionItem { id: string; text: string; memberId: string }
interface Meeting {
  id: string; title: string; client: string; time: string; date: string; phone: string
  agenda: AgendaItem[]; notes: string; actions: ActionItem[]
}

const uid = () => Math.random().toString(36).slice(2, 9)

const SEED: Meeting[] = [
  {
    id: 'm1', title: 'Reunião de aprovação — Casa Lumen', client: 'Casa Lumen', time: '11:00',
    date: 'Hoje', phone: '5215512345678',
    agenda: [
      { id: 'a1', text: 'Resultados de junho (alcance + leads)', done: true },
      { id: 'a2', text: 'Aprovação do calendário editorial de julho', done: true },
      { id: 'a3', text: 'Proposta: campanha de tráfego pago', done: false },
    ],
    notes: 'Cliente adorou os resultados de junho. Aprovou o calendário de julho com pequenos ajustes de tom. Demonstrou interesse em investir em tráfego pago a partir de agosto.',
    actions: [
      { id: 'x1', text: 'Enviar proposta de tráfego pago', memberId: 'g3' },
      { id: 'x2', text: 'Ajustar tom de 2 posts do calendário', memberId: 'g4' },
    ],
  },
  {
    id: 'm2', title: 'Call comercial — Nube Fitness', client: 'Nube Fitness', time: '15:00',
    date: 'Hoje', phone: '5215566778899',
    agenda: [
      { id: 'a1', text: 'Entender objetivos da academia', done: false },
      { id: 'a2', text: 'Apresentar cases do segmento', done: false },
    ],
    notes: '',
    actions: [],
  },
]

export function ReunioesView() {
  const [meetings, setMeetings] = useState<Meeting[]>(SEED)
  const [selId, setSelId] = useState('m1')
  const [newItem, setNewItem] = useState('')
  const [ata, setAta] = useState<string | null>(null)
  const [gerando, setGerando] = useState(false)

  const sel = meetings.find((m) => m.id === selId)!

  function patch(fn: (m: Meeting) => Meeting) {
    setMeetings((prev) => prev.map((m) => m.id === selId ? fn(m) : m))
    setAta(null)
  }

  function gerarAta() {
    setGerando(true)
    setTimeout(() => {
      const feitos = sel.agenda.filter((a) => a.done)
      const pendentes = sel.agenda.filter((a) => !a.done)
      const linhas: string[] = []
      linhas.push(`📋 *Ata — ${sel.title}*`)
      linhas.push(`${sel.client} · ${sel.date} às ${sel.time}`)
      linhas.push('')
      linhas.push(`A reunião cobriu ${sel.agenda.length} ${sel.agenda.length === 1 ? 'ponto' : 'pontos'} de pauta${feitos.length ? `, com ${feitos.length} concluído(s)` : ''}.`)
      if (sel.notes.trim()) { linhas.push(''); linhas.push('📝 *Resumo*'); linhas.push(sel.notes.trim()) }
      if (feitos.length) { linhas.push(''); linhas.push('✅ *Decidido*'); feitos.forEach((a) => linhas.push(`• ${a.text}`)) }
      if (pendentes.length) { linhas.push(''); linhas.push('⏳ *Ficou pendente*'); pendentes.forEach((a) => linhas.push(`• ${a.text}`)) }
      if (sel.actions.length) {
        linhas.push(''); linhas.push('🎯 *Próximos passos*')
        sel.actions.forEach((ac) => linhas.push(`• ${ac.text} — ${memberOf(ac.memberId)?.name.split(' ')[0] ?? '—'}`))
      }
      linhas.push(''); linhas.push('_Ata gerada automaticamente pelo Atlas._')
      setAta(linhas.join('\n'))
      setGerando(false)
      toast.success('✨ Ata gerada pelo Atlas!')
    }, 900)
  }

  const waLink = useMemo(() => ata ? `https://wa.me/${sel.phone}?text=${encodeURIComponent(ata)}` : '#', [ata, sel.phone])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="kicker text-brand">Operação</p>
        <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">Reuniões</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pauta, anotações e próximos passos — e o Atlas escreve a ata pra você.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Lista */}
        <div className="space-y-2">
          <p className="kicker px-1 text-muted-foreground/50">Hoje</p>
          {meetings.map((m) => (
            <button key={m.id} onClick={() => { setSelId(m.id); setAta(null) }}
              className={cn('flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-all',
                selId === m.id ? 'border-brand/40 bg-brand/[0.06]' : 'border-border bg-card hover:border-brand/25')}>
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-brand"><Video className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{m.title}</p>
                <p className="text-xs text-muted-foreground"><Clock className="mr-1 inline size-3" />{m.time} · {m.client}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Sala */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 shadow-card">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">{sel.title}</h2>
              <p className="text-sm text-muted-foreground">{sel.client} · {sel.date} às {sel.time}</p>
            </div>
            <a href="https://meet.google.com/" target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-gold">
              <Video className="size-4" /> Entrar na call
            </a>
          </div>

          {/* Pauta */}
          <Panel title="Pauta">
            <div className="space-y-1.5">
              {sel.agenda.map((a) => (
                <button key={a.id} onClick={() => patch((m) => ({ ...m, agenda: m.agenda.map((x) => x.id === a.id ? { ...x, done: !x.done } : x) }))}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/[0.03]">
                  {a.done ? <Check className="size-4 shrink-0 text-emerald-400" /> : <Circle className="size-4 shrink-0 text-muted-foreground/40" />}
                  <span className={cn('text-sm', a.done ? 'text-muted-foreground line-through' : 'text-foreground')}>{a.text}</span>
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newItem.trim()) { patch((m) => ({ ...m, agenda: [...m.agenda, { id: uid(), text: newItem.trim(), done: false }] })); setNewItem('') } }}
                placeholder="Adicionar ponto de pauta…" className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30" />
              <button onClick={() => { if (newItem.trim()) { patch((m) => ({ ...m, agenda: [...m.agenda, { id: uid(), text: newItem.trim(), done: false }] })); setNewItem('') } }} className="grid size-9 place-items-center rounded-lg bg-secondary text-foreground hover:bg-white/10"><Plus className="size-4" /></button>
            </div>
          </Panel>

          {/* Anotações */}
          <Panel title="Anotações">
            <textarea value={sel.notes} onChange={(e) => patch((m) => ({ ...m, notes: e.target.value }))} rows={3}
              placeholder="Anote os pontos da conversa…" className="w-full resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30" />
          </Panel>

          {/* Próximos passos */}
          <Panel title="Próximos passos">
            <div className="space-y-1.5">
              {sel.actions.map((ac) => {
                const m = memberOf(ac.memberId)
                return (
                  <div key={ac.id} className="flex items-center gap-2.5 rounded-lg bg-white/[0.02] px-3 py-2">
                    <span className="text-sm text-foreground flex-1">{ac.text}</span>
                    {m && <span className="grid size-6 place-items-center rounded-full text-[10px] font-bold text-black" style={{ backgroundColor: m.color }} title={m.name}>{m.initials}</span>}
                    <button onClick={() => patch((mm) => ({ ...mm, actions: mm.actions.filter((y) => y.id !== ac.id) }))} className="text-muted-foreground/50 hover:text-rose-300"><X className="size-3.5" /></button>
                  </div>
                )
              })}
              {sel.actions.length === 0 && <p className="text-sm text-muted-foreground">Nenhum ainda.</p>}
              <AddAction onAdd={(text, memberId) => patch((m) => ({ ...m, actions: [...m.actions, { id: uid(), text, memberId }] }))} />
            </div>
          </Panel>

          {/* Ata IA */}
          <div className="rounded-2xl border border-brand/25 bg-gradient-to-br from-brand/[0.06] to-card p-5 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-brand" />
                <h3 className="font-display text-sm font-bold text-foreground">Ata automática</h3>
              </div>
              <button onClick={gerarAta} disabled={gerando} className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-xs font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60">
                <Sparkles className="size-3.5" /> {gerando ? 'Escrevendo…' : ata ? 'Gerar de novo' : 'Gerar ata com IA'}
              </button>
            </div>
            {ata && (
              <div className="mt-3">
                <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-background/60 p-4 font-sans text-[13px] leading-relaxed text-foreground/90">{ata}</pre>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => { navigator.clipboard.writeText(ata); toast.success('Ata copiada!') }} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 text-xs font-medium text-foreground hover:bg-secondary">
                    <Copy className="size-3.5" /> Copiar
                  </button>
                  <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 text-xs font-semibold text-black">
                    <MessageCircle className="size-3.5" /> Enviar por WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AddAction({ onAdd }: { onAdd: (text: string, memberId: string) => void }) {
  const [text, setText] = useState('')
  const [memberId, setMemberId] = useState(GINGA_TEAM[0]?.id ?? '')
  return (
    <div className="flex items-center gap-2 pt-1">
      <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && text.trim()) { onAdd(text.trim(), memberId); setText('') } }}
        placeholder="Novo próximo passo…" className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30" />
      <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none">
        {GINGA_TEAM.map((m) => <option key={m.id} value={m.id}>{m.name.split(' ')[0]}</option>)}
      </select>
      <button onClick={() => { if (text.trim()) { onAdd(text.trim(), memberId); setText('') } }} className="grid size-9 place-items-center rounded-lg bg-secondary text-foreground hover:bg-white/10"><Plus className="size-4" /></button>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <p className="kicker mb-3 text-muted-foreground/50">{title}</p>
      {children}
    </div>
  )
}
