'use client'

import { useState } from 'react'
import { UserPlus, Copy, MessageCircle, Mail, Link2, Check, Crown, UserRound, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'

const PAPEIS = [
  { id: 'membro',  label: 'Colaborador', icon: UserRound, desc: 'Vê o Meu Dia, tarefas, agenda e aprovações. Sem financeiro nem comercial.' },
  { id: 'gerente', label: 'Gerente',     icon: Crown,     desc: 'Acesso completo à operação e ao comercial. Não altera faturamento.' },
] as const

const token = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)

export function ConvidarColaborador() {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [contato, setContato] = useState('')
  const [funcao, setFuncao] = useState('')
  const [papel, setPapel] = useState<'membro' | 'gerente'>('membro')
  const [link, setLink] = useState<string | null>(null)

  function gerar() {
    if (!nome.trim()) { toast.error('Informe o nome do colaborador'); return }
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    setLink(`${origin}/convite/${token()}`)
    toast.success('Convite gerado! 🎉')
  }

  const papelLabel = PAPEIS.find((p) => p.id === papel)!.label
  const msg = link
    ? `Olá${nome ? ' ' + nome.split(' ')[0] : ''}! 🌀 Você foi convidado para a *Ginga Studio* como *${papelLabel}*${funcao ? ` (${funcao})` : ''}.\n\nÉ só acessar e criar seu login:\n${link}\n\nAté já! — Equipe Ginga Studio`
    : ''
  const waPhone = contato.replace(/\D/g, '')

  function reset() {
    setNome(''); setContato(''); setFuncao(''); setPapel('membro'); setLink(null)
  }

  return (
    <>
      <button
        onClick={() => { reset(); setOpen(true) }}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.02] active:scale-95"
      >
        <UserPlus className="size-4" /> Convidar
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Convidar colaborador</SheetTitle>
            <SheetDescription>Gere um convite com acesso próprio — ele cria o login e já cai no painel dele.</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Nome</span>
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Ana Ruiz" className={inp} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Função</span>
                <input value={funcao} onChange={(e) => setFuncao(e.target.value)} placeholder="Design" className={inp} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">WhatsApp / e-mail</span>
                <input value={contato} onChange={(e) => setContato(e.target.value)} placeholder="+52…" className={inp} />
              </label>
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Nível de acesso</span>
              <div className="space-y-2">
                {PAPEIS.map((p) => {
                  const Icon = p.icon
                  const active = papel === p.id
                  return (
                    <button key={p.id} onClick={() => setPapel(p.id)}
                      className={cn('flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-all',
                        active ? 'border-brand bg-brand/10' : 'border-border bg-card hover:border-brand/30')}>
                      <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', active ? 'bg-brand/20 text-brand' : 'bg-secondary text-muted-foreground')}>
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">{p.label}</p>
                        <p className="text-xs text-muted-foreground">{p.desc}</p>
                      </div>
                      {active && <Check className="size-4 shrink-0 text-brand" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {!link ? (
              <button onClick={gerar} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.01] active:scale-95">
                <Sparkles className="size-4" /> Gerar convite
              </button>
            ) : (
              <div className="space-y-3 rounded-2xl border border-brand/25 bg-background/60 p-4">
                <p className="kicker text-brand">Convite pronto</p>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                  <Link2 className="size-4 shrink-0 text-brand" />
                  <span className="truncate font-mono text-xs text-foreground">{link}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => { navigator.clipboard.writeText(link); toast.success('Link copiado!') }} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 text-xs font-medium text-foreground hover:bg-secondary"><Copy className="size-3.5" /> Copiar link</button>
                  <a href={`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 text-xs font-semibold text-black"><MessageCircle className="size-3.5" /> WhatsApp</a>
                  <a href={`mailto:${contato}?subject=${encodeURIComponent('Convite Ginga Studio')}&body=${encodeURIComponent(msg)}`} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 text-xs font-medium text-foreground hover:bg-secondary"><Mail className="size-3.5" /> E-mail</a>
                </div>
                <button onClick={reset} className="text-xs font-medium text-muted-foreground hover:text-foreground">Gerar outro convite</button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

const inp = 'h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30'
