'use client'

import { useState } from 'react'
import { MessageSquare, Clock, Check, RotateCcw, Send, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  GINGA_APPROVALS, APPROVAL_STATUS_META, APPROVAL_TYPE_META, PREVIEW_GRADIENT,
  clientOf, type DemoApproval, type DemoApprovalComment,
} from '@/lib/demo/agency'
import type { ApprovalStatus } from '@/types/database'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'

const FILTERS: { id: 'todos' | ApprovalStatus; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'enviado', label: 'Enviados' },
  { id: 'alteracao', label: 'Alteração' },
  { id: 'aprovado', label: 'Aprovados' },
]

export function AprovacoesBoard() {
  const [items, setItems] = useState<DemoApproval[]>(GINGA_APPROVALS)
  const [filter, setFilter] = useState<'todos' | ApprovalStatus>('todos')
  const [selId, setSelId] = useState<string | null>(null)
  const [comment, setComment] = useState('')

  const shown = filter === 'todos' ? items : items.filter((a) => a.status === filter)
  const sel = items.find((a) => a.id === selId) ?? null
  const pendentes = items.filter((a) => ['enviado', 'reenviado', 'alteracao'].includes(a.status)).length

  function patch(id: string, fn: (a: DemoApproval) => DemoApproval) {
    setItems((prev) => prev.map((a) => a.id === id ? fn(a) : a))
  }

  function setStatus(id: string, status: ApprovalStatus, msg: string) {
    patch(id, (a) => ({ ...a, status }))
    toast.success(msg)
  }

  function addComment(id: string, fromClient: boolean) {
    if (!comment.trim()) return
    const c: DemoApprovalComment = { id: crypto.randomUUID(), author: fromClient ? 'Cliente' : 'Ginga Studio', fromClient, text: comment.trim(), at: new Date().toISOString().split('T')[0] }
    patch(id, (a) => ({ ...a, comments: [...a.comments, c] }))
    setComment('')
    toast.success('Comentário adicionado')
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-brand">Central de Aprovação</p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">Aprovações</h1>
          <p className="mt-1 text-sm text-muted-foreground">{pendentes} materiais aguardando ação · versões e comentários registrados.</p>
        </div>
        <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-gold">
          <Upload className="size-4" /> Enviar material
        </button>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={cn('rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
              filter === f.id ? 'border-brand bg-brand/10 text-brand' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((a) => {
          const c = clientOf(a.clientId)
          const meta = APPROVAL_STATUS_META[a.status]
          const type = APPROVAL_TYPE_META[a.type]
          return (
            <button key={a.id} onClick={() => setSelId(a.id)} className="group animate-rise overflow-hidden rounded-2xl border border-border bg-card text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-brand/30">
              <div className={cn('relative flex h-36 items-center justify-center bg-gradient-to-br', PREVIEW_GRADIENT[a.preview] ?? 'from-zinc-500/40 to-zinc-700/40')}>
                <span className="text-4xl opacity-90 drop-shadow">{type.emoji}</span>
                <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">v{a.version}</span>
                <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">{type.label}</span>
              </div>
              <div className="p-4">
                <p className="truncate text-sm font-semibold text-foreground">{a.title}</p>
                <p className="text-xs text-muted-foreground">{c?.name}</p>
                <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground/80">{a.caption}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', meta.chip)}>{meta.label}</span>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><MessageSquare className="size-3" /> {a.comments.length}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {new Date(`${a.at}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Detalhe */}
      <Sheet open={!!sel} onOpenChange={(o) => !o && setSelId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {sel && (
            <>
              <SheetHeader className="border-b border-border">
                <SheetTitle>{sel.title}</SheetTitle>
                <SheetDescription>{clientOf(sel.clientId)?.name} · versão {sel.version} · {APPROVAL_TYPE_META[sel.type].label}</SheetDescription>
              </SheetHeader>

              <div className="space-y-4 px-4">
                <div className={cn('flex h-44 items-center justify-center rounded-2xl bg-gradient-to-br', PREVIEW_GRADIENT[sel.preview])}>
                  <span className="text-6xl opacity-90 drop-shadow">{APPROVAL_TYPE_META[sel.type].emoji}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', APPROVAL_STATUS_META[sel.status].chip)}>{APPROVAL_STATUS_META[sel.status].label}</span>
                  <span className="text-xs text-muted-foreground">{sel.caption}</span>
                </div>

                {/* Ações da agência (simula visão do cliente também) */}
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setStatus(sel.id, 'aprovado', '🎉 Material aprovado!')} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-500/15 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-500/30 transition-colors hover:bg-emerald-500/25">
                    <Check className="size-4" /> Aprovar
                  </button>
                  <button onClick={() => setStatus(sel.id, 'alteracao', 'Alteração solicitada')} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-amber-500/15 text-sm font-semibold text-amber-300 ring-1 ring-amber-500/30 transition-colors hover:bg-amber-500/25">
                    <RotateCcw className="size-4" /> Alterar
                  </button>
                  <button onClick={() => { patch(sel.id, (a) => ({ ...a, version: a.version + 1, status: 'reenviado' })); toast.success('Nova versão reenviada') }} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-secondary text-sm font-semibold text-foreground transition-colors hover:bg-white/10">
                    <Send className="size-4" /> Reenviar
                  </button>
                </div>

                {/* Comentários */}
                <div className="border-t border-border pt-4">
                  <p className="kicker mb-2 text-muted-foreground/50">Comentários</p>
                  <div className="space-y-2">
                    {sel.comments.length === 0 && <p className="text-sm text-muted-foreground">Sem comentários ainda.</p>}
                    {sel.comments.map((c) => (
                      <div key={c.id} className={cn('rounded-xl border p-3', c.fromClient ? 'border-sky-500/20 bg-sky-500/[0.06]' : 'border-border bg-white/[0.02]')}>
                        <div className="flex items-center justify-between">
                          <span className={cn('text-xs font-semibold', c.fromClient ? 'text-sky-300' : 'text-foreground')}>{c.author}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(`${c.at}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                        </div>
                        <p className="mt-1 text-sm text-foreground/85">{c.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <input value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addComment(sel.id, false)}
                      placeholder="Escreva um comentário…" className="h-10 flex-1 rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30" />
                    <button onClick={() => addComment(sel.id, false)} className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-brand-foreground shadow-gold"><Send className="size-4" /></button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
