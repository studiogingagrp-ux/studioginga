'use client'

import { useEffect, useState } from 'react'
import {
  Search, Send, Paperclip, ImageIcon, Smile, Check, CheckCheck,
  Phone, MoreVertical, Sparkles, AlertCircle, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  DEMO_CONVERSATIONS, QUICK_TEMPLATES,
  type DemoConversation,
} from '@/lib/demo/whatsapp'

const TAGS: Record<string, { label: string; cls: string }> = {
  confirmacao: { label: 'Confirmação', cls: 'bg-emerald-50 text-emerald-700' },
  lembrete:    { label: 'Lembrete',    cls: 'bg-sky-50 text-sky-700' },
  novo:        { label: 'Novo',        cls: 'bg-violet-50 text-violet-700' },
}

type ConnectionState = 'checking' | 'open' | 'close' | 'not_configured' | 'error'

export function WhatsappCentral() {
  const [convos, setConvos]           = useState<DemoConversation[]>(DEMO_CONVERSATIONS)
  const [activeId, setActiveId]       = useState('c1')
  const [search, setSearch]           = useState('')
  const [onlyUnread, setOnlyUnread]   = useState(false)
  const [input, setInput]             = useState('')
  const [sending, setSending]         = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [connState, setConnState]     = useState<ConnectionState>('checking')
  const [usingRealChats, setUsingRealChats] = useState(false)

  // Verificar conexão com Evolution API
  useEffect(() => {
    fetch('/api/whatsapp/status')
      .then((r) => r.json())
      .then((d) => setConnState(d.state ?? 'error'))
      .catch(() => setConnState('error'))
  }, [])

  // Carregar conversas reais quando conectado
  useEffect(() => {
    if (connState !== 'open') return
    fetch('/api/whatsapp/chats')
      .then((r) => r.json())
      .then((d) => {
        if (d.chats?.length) {
          const real: DemoConversation[] = d.chats.map((c: Record<string, unknown>) => ({
            id:       c.id as string,
            name:     c.name as string,
            phone:    c.phone as string,
            initials: c.initials as string,
            lastAt:   c.lastAt as string,
            unread:   c.unread as number,
            messages: [{ id: 'stub', direction: 'in' as const, body: c.lastBody as string, time: c.lastAt as string }],
          }))
          setConvos(real)
          setActiveId(real[0]?.id ?? '')
          setUsingRealChats(true)
        }
      })
      .catch(() => null)
  }, [connState])

  // Carregar mensagens reais ao trocar de conversa (Evolution API)
  useEffect(() => {
    if (!usingRealChats || !activeId) return
    const convo = convos.find((c) => c.id === activeId)
    if (!convo?.id) return
    setLoadingMsgs(true)
    fetch(`/api/whatsapp/messages?jid=${encodeURIComponent(convo.id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.messages?.length) {
          setConvos((prev) => prev.map((c) =>
            c.id === activeId
              ? { ...c, messages: d.messages as DemoConversation['messages'], unread: 0 }
              : c,
          ))
        }
      })
      .catch(() => null)
      .finally(() => setLoadingMsgs(false))
  }, [activeId, usingRealChats]) // eslint-disable-line react-hooks/exhaustive-deps

  const isReal = connState === 'open'
  const active = convos.find((c) => c.id === activeId)
  const filtered = convos.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) && (!onlyUnread || c.unread > 0),
  )

  function openConvo(id: string) {
    setActiveId(id)
    setConvos((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)))
  }

  async function send() {
    if (!input.trim() || !active) return
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const msgBody = input.trim()
    setInput('')

    // Optimistic update
    setConvos((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, lastAt: now, messages: [...c.messages, { id: crypto.randomUUID(), direction: 'out', body: msgBody, time: now, status: 'sent' as const }] }
          : c,
      ),
    )

    if (isReal) {
      setSending(true)
      try {
        const res = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: active.phone, text: msgBody }),
        })
        if (!res.ok) {
          const err = await res.json()
          toast.error(err.error ?? 'Erro ao enviar')
        }
      } catch {
        toast.error('Erro de conexão com a API')
      } finally {
        setSending(false)
      }
    }
  }

  const connBadge = {
    checking:       { label: 'Verificando…', cls: 'bg-amber-50 text-amber-700',  dot: 'bg-amber-400' },
    open:           { label: 'Conectado',     cls: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500 animate-pulse' },
    close:          { label: 'Desconectado',  cls: 'bg-rose-50 text-rose-700',    dot: 'bg-rose-500' },
    not_configured: { label: 'Não configurado', cls: 'bg-secondary text-muted-foreground', dot: 'bg-border' },
    error:          { label: 'Erro',          cls: 'bg-rose-50 text-rose-700',    dot: 'bg-rose-500' },
  }[connState]

  return (
    <div className="flex h-[calc(100dvh-8rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      {/* Lista de conversas */}
      <aside className="flex w-full max-w-xs shrink-0 flex-col border-r border-border">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold text-foreground">Conversas</h2>
            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium', connBadge.cls)}>
              <span className={cn('size-1.5 rounded-full', connBadge.dot)} />
              {connState === 'checking' ? <Loader2 className="size-3 animate-spin" /> : null}
              {connBadge.label}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm">
            <Search className="size-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversa…"
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground" />
          </div>
          <div className="mt-3 flex gap-1.5">
            {[{ id: 'todas', label: 'Todas', on: !onlyUnread }, { id: 'unread', label: 'Não lidas', on: onlyUnread }].map((f) => (
              <button key={f.id} onClick={() => setOnlyUnread(f.id === 'unread')}
                className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  f.on ? 'bg-brand-gradient text-brand-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map((c) => (
            <button key={c.id} onClick={() => openConvo(c.id)}
              className={cn('flex w-full items-center gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-secondary/50',
                c.id === activeId && 'bg-accent/50')}>
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-gradient text-sm font-semibold text-brand-foreground">
                {c.initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{c.lastAt}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-muted-foreground">
                    {c.messages.at(-1)?.direction === 'out' ? 'Você: ' : ''}
                    {c.messages.at(-1)?.body}
                  </p>
                  {c.unread > 0 && (
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand text-[10px] font-bold text-brand-foreground">
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Aviso de configuração */}
        {connState === 'not_configured' && (
          <div className="border-t border-border p-3">
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              <span>Configure <strong>EVOLUTION_API_URL</strong> e <strong>EVOLUTION_API_KEY</strong> no <code>.env.local</code> para ativar o WhatsApp real.</span>
            </div>
          </div>
        )}
      </aside>

      {/* Conversa ativa */}
      {active ? (
        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-brand-gradient text-sm font-semibold text-brand-foreground">
                {active.initials}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{active.name}</p>
                  {active.tag && (
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', TAGS[active.tag]?.cls)}>
                      {TAGS[active.tag]?.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">+55 {active.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <button className="grid size-9 place-items-center rounded-lg hover:bg-secondary"><Phone className="size-4" /></button>
              <button className="grid size-9 place-items-center rounded-lg hover:bg-secondary"><MoreVertical className="size-4" /></button>
            </div>
          </header>

          {/* Mensagens */}
          <div className="flex-1 space-y-2 overflow-y-auto bg-secondary/30 px-5 py-4">
            <div className="mb-2 flex justify-center">
              <span className="rounded-full bg-card px-3 py-1 text-[11px] text-muted-foreground shadow-soft">
                {usingRealChats ? 'Mensagens reais da instância' : 'Dados de demonstração'}
              </span>
            </div>
            {loadingMsgs ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : active.messages.map((m) => (
              <div key={m.id} className={cn('flex', m.direction === 'out' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-soft',
                  m.direction === 'out' ? 'rounded-br-md bg-accent text-foreground' : 'rounded-bl-md bg-card text-foreground')}>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                  <span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                    {m.time}
                    {m.direction === 'out' && (
                      m.status === 'read'
                        ? <CheckCheck className="size-3 text-sky-500" />
                        : m.status === 'delivered'
                          ? <CheckCheck className="size-3" />
                          : <Check className="size-3" />
                    )}
                  </span>
                </div>
              </div>
            ))}
            </div>

          {/* Templates */}
          <div className="flex gap-1.5 overflow-x-auto border-t border-border px-4 py-2">
            <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <Sparkles className="size-3 text-brand" /> Templates:
            </span>
            {QUICK_TEMPLATES.map((t) => (
              <button key={t.label} onClick={() => setInput(t.text)}
                className="shrink-0 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-secondary">
                {t.label}
              </button>
            ))}
          </div>

          {/* Composer */}
          <div className="flex items-end gap-2 border-t border-border p-3">
            <div className="flex gap-0.5 text-muted-foreground">
              <button className="grid size-9 place-items-center rounded-lg hover:bg-secondary"><Smile className="size-5" /></button>
              <button className="grid size-9 place-items-center rounded-lg hover:bg-secondary"><Paperclip className="size-5" /></button>
              <button className="grid size-9 place-items-center rounded-lg hover:bg-secondary"><ImageIcon className="size-5" /></button>
            </div>
            <textarea value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() } }}
              rows={1} placeholder="Escreva uma mensagem…"
              className="max-h-32 min-h-[40px] flex-1 resize-none rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand/30" />
            <button onClick={() => void send()} disabled={!input.trim() || sending}
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-brand-foreground shadow-soft transition-transform hover:scale-105 active:scale-95 disabled:opacity-40">
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </div>
        </section>
      ) : (
        <section className="grid flex-1 place-items-center text-sm text-muted-foreground">
          Selecione uma conversa
        </section>
      )}
    </div>
  )
}
