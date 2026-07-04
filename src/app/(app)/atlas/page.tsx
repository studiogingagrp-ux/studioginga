'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Send, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  GINGA_TEAM, GINGA_CLIENTS, GINGA_APPROVALS, GINGA_TASKS, GINGA_ALERTS,
  ATLAS_SEVERITY_META, isLate,
} from '@/lib/demo/agency'

const SUGESTOES = [
  'Quem está disponível hoje?',
  'Quais clientes estão há mais de 30 dias sem contato?',
  'O que está atrasado?',
  'Quais aprovações estão pendentes?',
]

/** Respostas do Atlas — parser de linguagem natural (demo determinística). */
function responderAtlas(pergunta: string): string {
  const t = pergunta.toLowerCase()

  if (/dispon|quem est|livre|folga/.test(t)) {
    const on = GINGA_TEAM.filter((m) => m.online).map((m) => m.name.split(' ')[0])
    return `Agora estão disponíveis: ${on.join(', ')}. Valentina e Camila estão fora no momento. Quer que eu distribua alguma tarefa para quem está livre?`
  }
  if (/sem contato|30 dias|42|reativ|sumido/.test(t)) {
    const s = GINGA_CLIENTS.filter((c) => c.lastContactDays >= 14)
      .map((c) => `${c.name} (${c.lastContactDays} dias)`)
    return s.length
      ? `Clientes sem contato recente: ${s.join(', ')}. A Fuego Cantina é a mais crítica — sugiro uma mensagem de reativação hoje. Quero preparar o texto?`
      : 'Todos os clientes tiveram contato nos últimos dias. 👏'
  }
  if (/atrasad|atras|vencid|prazo/.test(t)) {
    const late = GINGA_TASKS.filter((x) => x.status !== 'concluido' && isLate(x.due)).map((x) => x.title)
    return `Há ${late.length} item(ns) atrasado(s): ${late.join('; ')}. O corte do vídeo da Clínica Aurora é o mais sensível — depende só do aval do cliente. Quer que eu mande um lembrete?`
  }
  if (/aprova/.test(t)) {
    const p = GINGA_APPROVALS.filter((a) => ['enviado', 'reenviado', 'alteracao'].includes(a.status))
    return `${p.length} aprovações aguardando: ${p.map((a) => a.title).join('; ')}. A campanha da Verde Market é prioridade — precisa subir em 3 dias.`
  }
  if (/reorgan|agenda|reorganize|otimiz/.test(t)) {
    return 'Posso reorganizar sua agenda liberando 2 janelas de foco pela manhã e agrupando as calls comerciais à tarde. Também moveria a gravação da Clínica Aurora para não colidir com a reunião das 11h. Confirma que eu aplico?'
  }
  if (/reun|marca|agend/.test(t)) {
    return 'Certo — me diga com quem e quando (ex: "reunião com a Casa Lumen quinta 15h") que eu crio o compromisso, aviso os envolvidos e adiciono à agenda compartilhada.'
  }
  return 'Entendido. Posso analisar agenda, projetos, aprovações, financeiro e a equipe. Tente algo como "quem está sobrecarregado?" ou "qual campanha está mais perto do prazo?".'
}

type Msg = { from: 'user' | 'atlas'; text: string }

export default function AtlasPage() {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')

  function send(text: string) {
    const q = text.trim()
    if (!q) return
    setMsgs((m) => [...m, { from: 'user', text: q }, { from: 'atlas', text: responderAtlas(q) }])
    setInput('')
  }

  const porSeveridade = (['urgente', 'atencao', 'oportunidade', 'info'] as const)
    .map((sev) => ({ sev, itens: GINGA_ALERTS.filter((a) => a.severity === sev) }))
    .filter((g) => g.itens.length)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-gradient shadow-gold animate-pulse-gold">
          <Sparkles className="size-5 text-brand-foreground" />
        </span>
        <div>
          <p className="kicker text-brand">Inteligência</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">Atlas</h1>
          <p className="text-sm text-muted-foreground">A gerente de operações da agência — entende linguagem natural.</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Chat */}
        <div className="lg:col-span-3">
          <div className="flex min-h-[380px] flex-col overflow-hidden rounded-2xl border border-brand/25 bg-card shadow-card">
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {msgs.length === 0 && (
                <div className="rounded-xl bg-white/[0.02] p-4 text-sm leading-relaxed text-muted-foreground">
                  <span className="text-foreground">Bom dia, Estevam.</span> Sou o Atlas. Posso reorganizar sua agenda,
                  encontrar clientes esquecidos, apontar gargalos e oportunidades. Pergunte à vontade — abaixo tem alguns exemplos.
                </div>
              )}
              {msgs.map((m, i) => (
                <div key={i} className={cn('flex', m.from === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                    m.from === 'user'
                      ? 'bg-brand-gradient text-brand-foreground'
                      : 'border border-border bg-white/[0.03] text-foreground/90',
                  )}>
                    {m.from === 'atlas' && <span className="kicker mb-1 block text-brand">Atlas</span>}
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border p-3">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {SUGESTOES.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-brand/40 hover:text-foreground">
                    {s}
                  </button>
                ))}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pergunte ao Atlas…"
                  className="h-11 flex-1 rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30"
                />
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
            {porSeveridade.map((g) => g.itens.map((al) => {
              const sev = ATLAS_SEVERITY_META[al.severity]
              return (
                <Link key={al.id} href={al.href ?? '#'} className={cn('group block rounded-2xl border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 ring-1', sev.ring, 'border-border')}>
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
            }))}
          </div>
        </div>
      </div>
    </div>
  )
}
