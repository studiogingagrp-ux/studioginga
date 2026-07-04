'use client'

import { useState } from 'react'
import { Send, Copy, MessageCircle, Mail, Link2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'

export function EnviarPortal({ name, contact, phone, slug }: { name: string; contact: string; phone: string; slug: string }) {
  const [open, setOpen] = useState(false)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const link = `${origin}/portal/${slug}`
  const first = contact.split(' ')[0]
  const msg = `Olá ${first}! 👋 Esse é o portal exclusivo da *${name}* na *Ginga Studio*.\n\nAqui você acompanha os projetos, aprova materiais com um toque e vê as próximas reuniões — tudo em um lugar:\n${link}\n\nQualquer coisa, é só chamar por aqui. 🌀`

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-gradient text-xs font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.02] active:scale-95"
      >
        <Send className="size-3.5" /> Enviar portal
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Enviar portal — {name}</SheetTitle>
            <SheetDescription>Mande o acesso do cliente por WhatsApp ou e-mail. Ele entra sem senha, só pelo link seguro.</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
              <ShieldCheck className="size-4 shrink-0" /> Link exclusivo — só quem tem o endereço acessa.
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
              <Link2 className="size-4 shrink-0 text-brand" />
              <span className="truncate font-mono text-xs text-foreground">{link}</span>
            </div>

            <div className="rounded-2xl border border-border bg-background/60 p-3">
              <p className="kicker mb-1.5 text-muted-foreground/60">Mensagem</p>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/85">{msg}</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <a href={`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-black transition-transform hover:scale-[1.01] active:scale-95">
                <MessageCircle className="size-4" /> Enviar por WhatsApp
              </a>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { navigator.clipboard.writeText(link); toast.success('Link copiado!') }} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-xs font-medium text-foreground hover:bg-secondary"><Copy className="size-3.5" /> Copiar link</button>
                <a href={`mailto:?subject=${encodeURIComponent(`Seu portal na Ginga Studio — ${name}`)}&body=${encodeURIComponent(msg)}`} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-xs font-medium text-foreground hover:bg-secondary"><Mail className="size-3.5" /> E-mail</a>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
