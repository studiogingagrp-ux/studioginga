'use client'

import { useEffect, useState } from 'react'
import { Copy, ExternalLink, Link2, MessageCircle, Sparkles, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/page-header'

const SLUG = 'atlas-demo' // com Supabase conectado, vem do slug do workspace

export function PublicLinkManager() {
  const [origin, setOrigin] = useState('')
  useEffect(() => { setOrigin(window.location.origin) }, [])
  const url = `${origin}/agendar/${SLUG}`

  function copy() {
    navigator.clipboard.writeText(url)
    toast.success('Link copiado!')
  }

  const steps = [
    { icon: Link2,        title: 'Compartilhe o link',        desc: 'Bio do Instagram, assinatura de e-mail, propostas comerciais — onde seu cliente estiver.' },
    { icon: Sparkles,     title: 'O cliente escolhe sozinho', desc: 'Pessoa, dia e horário livre — horários ocupados nem aparecem. Zero vai-e-volta.' },
    { icon: CheckCircle2, title: 'Cai direto na agenda',      desc: 'A reunião entra na agenda de quem atende, com a cor da pessoa.' },
    { icon: MessageCircle, title: 'WhatsApp automático',      desc: 'Confirmação na hora + lembrete no dia anterior. O no-show despenca.' },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Link público de agendamento"
        subtitle="Seus clientes marcam reunião sozinhos, sem vai-e-volta"
      />

      {/* Card do link */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Seu link</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <code className="flex-1 truncate rounded-xl border border-border bg-secondary/50 px-4 py-3 font-mono text-sm text-foreground">
            {url || '…'}
          </code>
          <div className="flex gap-2">
            <button
              onClick={copy}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-95"
            >
              <Copy className="size-4" /> Copiar
            </button>
            <a
              href={`/agendar/${SLUG}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <ExternalLink className="size-4" /> Abrir
            </a>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Com o Supabase conectado, o link usa o endereço da sua empresa (ex: <span className="font-mono">/agendar/estevam</span>).
        </p>
      </div>

      {/* Como funciona */}
      <div className="grid gap-4 sm:grid-cols-2">
        {steps.map((s, i) => (
          <div key={s.title} className="animate-rise rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-accent text-brand">
                <s.icon className="size-5" />
              </span>
              <span className="text-xs font-semibold text-muted-foreground">Passo {i + 1}</span>
            </div>
            <h3 className="mt-3 font-medium text-foreground">{s.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
