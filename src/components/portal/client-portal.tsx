'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, RotateCcw, MessageSquare, FileText, Download, CalendarClock, FolderKanban, Sparkles, ShieldCheck, Send, MessagesSquare } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { LogoMark } from '@/components/brand/logo'
import { InstallPrompt } from '@/components/pwa/install-prompt'
import {
  APPROVAL_TYPE_META, PREVIEW_GRADIENT, PROJECT_STATUS_META,
  type GingaClient, type DemoProject, type DemoApproval, type DemoAgendaItem,
} from '@/lib/demo/agency'

const KIND: Record<string, string> = { reuniao: '🤝', entrega: '📦', gravacao: '🎬', call: '📞', interno: '🏢' }
const agora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

export function ClientPortal({
  client, projects, approvals: initialApprovals, meetings, agency,
}: {
  client: GingaClient
  projects: DemoProject[]
  approvals: DemoApproval[]
  meetings: DemoAgendaItem[]
  agency: string
}) {
  const [approvals, setApprovals] = useState(initialApprovals)
  const pendentes = approvals.filter((a) => ['enviado', 'reenviado', 'alteracao'].includes(a.status))
  const ativos = projects.filter((p) => !['finalizado', 'pausado'].includes(p.status))

  // aprovar comentando
  const [commentFor, setCommentFor] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')

  function act(id: string, status: 'aprovado' | 'alteracao', comment?: string) {
    setApprovals((prev) => prev.map((a) => a.id === id ? { ...a, status } : a))
    setCommentFor(null); setCommentText('')
    toast.success(status === 'aprovado' ? 'Obrigado! Material aprovado 🎉' : 'Pedido de alteração enviado à equipe')
    if (comment?.trim()) {
      setMessages((m) => [...m, { id: `c${Date.now()}`, from: 'client', text: `Sobre um material: ${comment.trim()}`, at: agora() }])
    }
  }

  // chat com a agência
  interface Msg { id: string; from: 'client' | 'agency'; text: string; at: string }
  const [messages, setMessages] = useState<Msg[]>([
    { id: 'm1', from: 'agency', text: `Olá, ${client.contact.split(' ')[0]}! Estamos por aqui para o que precisar. 🌀`, at: 'ontem' },
    { id: 'm2', from: 'agency', text: 'Assim que aprovar os materiais, já colocamos para produção. Qualquer ajuste, é só escrever aqui.', at: 'ontem' },
  ])
  const [input, setInput] = useState('')
  const threadRef = useRef<HTMLDivElement>(null)
  useEffect(() => { threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' }) }, [messages])

  function send() {
    const text = input.trim()
    if (!text) return
    setMessages((m) => [...m, { id: `u${Date.now()}`, from: 'client', text, at: agora() }])
    setInput('')
    setTimeout(() => {
      setMessages((m) => [...m, { id: `a${Date.now()}`, from: 'agency', text: 'Recebido! Já estou verificando com a equipe e te retorno em instantes. 💛', at: agora() }])
    }, 1200)
  }

  return (
    <div className="ginga-grain relative min-h-screen bg-background">
      <div aria-hidden className="ginga-glow pointer-events-none fixed inset-0 opacity-60" />

      {/* Topo */}
      <header className="relative z-10 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <div className="leading-none">
              <p className="font-display text-[15px] font-extrabold text-foreground">{agency}</p>
              <p className="kicker mt-1 text-muted-foreground">Portal do cliente</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
            <ShieldCheck className="size-3.5" /> Acesso seguro
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl space-y-8 px-5 py-8">
        {/* Hero */}
        <section>
          <p className="kicker text-brand">Bem-vindo, {client.contact.split(' ')[0]}</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {client.name}
          </h1>
          <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
            Aqui você acompanha tudo da sua conta com a {agency}: projetos em andamento, materiais para aprovar e as próximas reuniões — em um lugar só.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Stat icon={FolderKanban} label="Projetos ativos" value={String(ativos.length)} />
            <Stat icon={Check} label="Aguardando você" value={String(pendentes.length)} tone={pendentes.length ? 'text-amber-300' : 'text-emerald-300'} />
            <Stat icon={CalendarClock} label="Próxima reunião" value={meetings[0]?.time ?? '—'} />
          </div>
        </section>

        {/* Aguardando aprovação — o coração do portal */}
        {pendentes.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="size-4 text-brand" />
              <h2 className="font-display text-lg font-bold text-foreground">Aguardando sua aprovação</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {pendentes.map((a) => {
                const type = APPROVAL_TYPE_META[a.type]
                return (
                  <div key={a.id} className="overflow-hidden rounded-2xl border border-brand/25 bg-card shadow-card">
                    <div className={cn('relative flex h-40 items-center justify-center bg-gradient-to-br', PREVIEW_GRADIENT[a.preview])}>
                      <span className="text-5xl opacity-90 drop-shadow">{type.emoji}</span>
                      <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">v{a.version}</span>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-semibold text-foreground">{a.title}</p>
                      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{a.caption}</p>
                      {a.comments.length > 0 && (
                        <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground"><MessageSquare className="size-3" /> {a.comments.length} comentário(s)</p>
                      )}
                      {commentFor === a.id ? (
                        <div className="mt-3 space-y-2">
                          <textarea
                            autoFocus value={commentText} onChange={(e) => setCommentText(e.target.value)}
                            rows={2} placeholder="Descreva o ajuste que você quer…"
                            className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => act(a.id, 'alteracao', commentText)} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-amber-500 text-sm font-semibold text-black transition-transform hover:scale-[1.02] active:scale-95">
                              <Send className="size-3.5" /> Enviar ajuste
                            </button>
                            <button onClick={() => { setCommentFor(null); setCommentText('') }} className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-secondary text-sm font-medium text-muted-foreground hover:bg-white/10">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button onClick={() => act(a.id, 'aprovado')} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-sm font-semibold text-black transition-transform hover:scale-[1.02] active:scale-95">
                            <Check className="size-4" /> Aprovar
                          </button>
                          <button onClick={() => { setCommentFor(a.id); setCommentText('') }} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary text-sm font-semibold text-foreground transition-colors hover:bg-white/10">
                            <RotateCcw className="size-4" /> Pedir ajuste
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Projetos */}
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">Seus projetos</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <ul className="divide-y divide-border">
              {projects.map((p) => {
                const meta = PROJECT_STATUS_META[p.status]
                return (
                  <li key={p.id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{p.name}</p>
                      <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium', meta.chip)}>{meta.label}</span>
                    </div>
                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="w-9 text-right font-mono text-[11px] text-muted-foreground tabular">{p.progress}%</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        {/* Reuniões + Arquivos */}
        <section className="grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="mb-3 font-display text-lg font-bold text-foreground">Próximas reuniões</h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <ul className="divide-y divide-border">
                {meetings.length === 0 && <li className="px-5 py-4 text-sm text-muted-foreground">Nenhuma reunião agendada.</li>}
                {meetings.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="w-12 font-mono text-sm font-semibold text-brand tabular">{m.time}</span>
                    <span>{KIND[m.kind]}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">{m.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <h2 className="mb-3 font-display text-lg font-bold text-foreground">Arquivos finais</h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <ul className="divide-y divide-border">
                {['Manual de marca.pdf', 'Logo — pacote final.zip', 'Guia de redes sociais.pdf'].map((f) => (
                  <li key={f} className="flex items-center gap-3 px-5 py-3.5">
                    <FileText className="size-4 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">{f}</span>
                    <Download className="size-4 text-muted-foreground transition-colors hover:text-brand" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Mensagens — fala direto com a agência */}
        <section id="mensagens">
          <div className="mb-3 flex items-center gap-2">
            <MessagesSquare className="size-4 text-brand" />
            <h2 className="font-display text-lg font-bold text-foreground">Fale com a {agency}</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div ref={threadRef} className="max-h-72 space-y-3 overflow-y-auto p-4">
              {messages.map((m) => (
                <div key={m.id} className={cn('flex', m.from === 'client' ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                    m.from === 'client'
                      ? 'rounded-br-sm bg-brand-gradient text-brand-foreground'
                      : 'rounded-bl-sm bg-secondary text-foreground')}>
                    {m.from === 'agency' && <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">{agency}</p>}
                    <p>{m.text}</p>
                    <p className={cn('mt-1 text-[10px]', m.from === 'client' ? 'text-brand-foreground/70' : 'text-muted-foreground')}>{m.at}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t border-border p-3">
              <input
                value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') send() }}
                placeholder="Escreva uma mensagem…"
                className="h-10 flex-1 rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30"
              />
              <button onClick={send} className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-brand-foreground shadow-gold transition-transform hover:scale-105 active:scale-95" aria-label="Enviar">
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </section>

        <p className="pt-2 text-center text-[11px] text-muted-foreground/50">
          Portal do cliente · {agency} · desenvolvido por GRP Tecnologia
        </p>
      </main>
      <InstallPrompt />
    </div>
  )
}

function Stat({ icon: Icon, label, value, tone = 'text-foreground' }: { icon: typeof Check; label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="kicker">{label}</span>
      </div>
      <p className={cn('mt-2 font-display text-2xl font-extrabold tabular', tone)}>{value}</p>
    </div>
  )
}
