'use client'

import { useState } from 'react'
import { Check, Plug, Copy, KeyRound, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Integ { id: string; name: string; desc: string; emoji: string; connected: boolean }

const GROUPS: { label: string; items: Integ[] }[] = [
  {
    label: 'Calendário & Reuniões',
    items: [
      { id: 'gcal', name: 'Google Calendar', desc: 'Sincroniza a agenda nos dois sentidos.', emoji: '📅', connected: true },
      { id: 'outlook', name: 'Outlook', desc: 'Calendário e e-mail da Microsoft.', emoji: '📆', connected: false },
      { id: 'meet', name: 'Google Meet', desc: 'Cria o link da call automaticamente.', emoji: '🎥', connected: true },
      { id: 'zoom', name: 'Zoom', desc: 'Reuniões e gravações.', emoji: '🔵', connected: false },
      { id: 'teams', name: 'Microsoft Teams', desc: 'Reuniões corporativas.', emoji: '🟣', connected: false },
    ],
  },
  {
    label: 'Armazenamento',
    items: [
      { id: 'gdrive', name: 'Google Drive', desc: 'Arquivos dos projetos na nuvem.', emoji: '📁', connected: true },
      { id: 'onedrive', name: 'OneDrive', desc: 'Armazenamento da Microsoft.', emoji: '☁️', connected: false },
      { id: 'dropbox', name: 'Dropbox', desc: 'Entregáveis e materiais pesados.', emoji: '📦', connected: false },
    ],
  },
  {
    label: 'Comunicação',
    items: [
      { id: 'whatsapp', name: 'WhatsApp (Evolution)', desc: 'Confirmações, lembretes e o robô Atlas.', emoji: '💬', connected: true },
    ],
  },
]

export function IntegracoesView() {
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(GROUPS.flatMap((g) => g.items.map((i) => [i.id, i.connected]))),
  )

  function toggle(i: Integ) {
    setState((s) => ({ ...s, [i.id]: !s[i.id] }))
    toast.success(state[i.id] ? `${i.name} desconectado` : `${i.name} conectado 🎉`)
  }

  const token = 'ginga_sk_live_8f3a··················e21c'

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <p className="kicker text-brand">Conexões</p>
        <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">Integrações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Conecte as ferramentas que a agência já usa — tudo conversa com o Ginga.</p>
      </header>

      {GROUPS.map((g) => (
        <section key={g.label}>
          <p className="kicker mb-3 text-muted-foreground/50">{g.label}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {g.items.map((i) => {
              const on = state[i.id]
              return (
                <div key={i.id} className={cn('flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-card transition-colors', on ? 'border-brand/25' : 'border-border')}>
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-xl">{i.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold text-foreground">{i.name}</p>
                      {on && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-medium text-emerald-300"><Check className="size-2.5" /> Conectado</span>}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{i.desc}</p>
                  </div>
                  <button onClick={() => toggle(i)} className={cn('h-8 shrink-0 rounded-lg px-3 text-xs font-semibold transition-colors', on ? 'border border-border bg-secondary text-muted-foreground hover:bg-white/10' : 'bg-brand-gradient text-brand-foreground shadow-gold')}>
                    {on ? 'Desconectar' : 'Conectar'}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      ))}

      {/* API pública */}
      <section>
        <p className="kicker mb-3 text-muted-foreground/50">Desenvolvedores</p>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-brand" />
            <h2 className="font-display text-sm font-bold text-foreground">API pública</h2>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">Outros sistemas podem consumir agenda, clientes, projetos e tarefas do Ginga.</p>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3.5 py-2.5">
            <Plug className="size-4 shrink-0 text-muted-foreground" />
            <code className="flex-1 truncate font-mono text-xs text-foreground">{token}</code>
            <button onClick={() => { navigator.clipboard.writeText(token); toast.success('Chave copiada!') }} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-white/10"><Copy className="size-4" /></button>
            <button onClick={() => toast.success('Nova chave gerada')} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-white/10" title="Gerar nova"><RefreshCw className="size-4" /></button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {['GET /agenda', 'GET /clientes', 'GET /projetos', 'POST /tarefas'].map((e) => (
              <span key={e} className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{e}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
