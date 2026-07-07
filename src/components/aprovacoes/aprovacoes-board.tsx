'use client'

import { useState } from 'react'
import { MessageSquare, Clock, Check, RotateCcw, Send, Upload, Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  GINGA_APPROVALS, APPROVAL_STATUS_META, APPROVAL_TYPE_META, PREVIEW_GRADIENT, clientOf, GINGA_CLIENTS,
} from '@/lib/demo/agency'
import type { ApprovalStatus, ApprovalType } from '@/types/database'
import { createApproval, setApprovalStatus, reenviarApproval, addApprovalComment, removeApproval } from '@/lib/actions/approvals'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'

export interface CommentRow { id: string; author: string; fromClient: boolean; text: string; at: string }
export interface ApprovalRow { id: string; title: string; clientId: string | null; clientName: string; type: ApprovalType; status: ApprovalStatus; version: number; caption: string; preview: string; comments: CommentRow[]; at: string }
export interface Opt { id: string; name: string }

const TYPE_PREVIEW: Record<string, string> = { arte: 'gold', video: 'green', campanha: 'orange', post: 'violet', story: 'sky', landing: 'sky', copy: 'violet', documento: 'gold' }

const DEMO_ROWS: ApprovalRow[] = GINGA_APPROVALS.map((a) => ({
  id: a.id, title: a.title, clientId: a.clientId, clientName: clientOf(a.clientId)?.name ?? '—',
  type: a.type, status: a.status, version: a.version, caption: a.caption, preview: a.preview,
  comments: a.comments.map((c) => ({ id: c.id, author: c.author, fromClient: c.fromClient, text: c.text, at: c.at })), at: a.at,
}))
const DEMO_CLIENTS: Opt[] = GINGA_CLIENTS.map((c) => ({ id: c.id, name: c.name }))

const FILTERS: { id: 'todos' | ApprovalStatus; label: string }[] = [
  { id: 'todos', label: 'Todos' }, { id: 'enviado', label: 'Enviados' }, { id: 'alteracao', label: 'Alteração' }, { id: 'aprovado', label: 'Aprovados' },
]
const today = () => new Date().toISOString().split('T')[0]
const fmt = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

export function AprovacoesBoard({ initialItems, clients, isRealData }: { initialItems?: ApprovalRow[] | null; clients?: Opt[]; isRealData?: boolean }) {
  const [items, setItems] = useState<ApprovalRow[]>(initialItems ?? DEMO_ROWS)
  const clientOpts = isRealData ? (clients ?? []) : DEMO_CLIENTS
  const [filter, setFilter] = useState<'todos' | ApprovalStatus>('todos')
  const [selId, setSelId] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [novo, setNovo] = useState(false)
  const [form, setForm] = useState({ title: '', clientId: '', type: 'arte' as ApprovalType, caption: '' })
  const [pending, setPending] = useState(false)

  const shown = filter === 'todos' ? items : items.filter((a) => a.status === filter)
  const sel = items.find((a) => a.id === selId) ?? null
  const pendentes = items.filter((a) => ['enviado', 'reenviado', 'alteracao'].includes(a.status)).length

  const patch = (id: string, fn: (a: ApprovalRow) => ApprovalRow) => setItems((prev) => prev.map((a) => a.id === id ? fn(a) : a))

  function setStatus(id: string, status: ApprovalStatus, msg: string) {
    patch(id, (a) => ({ ...a, status })); toast.success(msg)
    if (isRealData) setApprovalStatus(id, status).then((r) => { if (r.error) toast.error(r.error) })
  }
  function reenviar(a: ApprovalRow) {
    patch(a.id, (x) => ({ ...x, version: x.version + 1, status: 'reenviado' })); toast.success('Nova versão reenviada')
    if (isRealData) reenviarApproval(a.id, a.version).then((r) => { if (r.error) toast.error(r.error) })
  }
  function addComment(id: string) {
    if (!comment.trim()) return
    const text = comment.trim()
    const c: CommentRow = { id: crypto.randomUUID(), author: 'Ginga Studio', fromClient: false, text, at: today() }
    patch(id, (a) => ({ ...a, comments: [...a.comments, c] })); setComment(''); toast.success('Comentário adicionado')
    if (isRealData) addApprovalComment(id, text, false).then((r) => { if (r.error) toast.error(r.error) })
  }
  function remove(id: string) {
    setItems((prev) => prev.filter((a) => a.id !== id)); setSelId(null)
    if (isRealData) removeApproval(id).then((r) => { if (r.error) toast.error(r.error) })
  }
  function criar() {
    if (!form.title.trim()) { toast.error('Informe o título'); return }
    const clientName = clientOpts.find((c) => c.id === form.clientId)?.name ?? '—'
    const done = (id: string) => {
      setItems((prev) => [{ id, title: form.title.trim(), clientId: form.clientId || null, clientName, type: form.type, status: 'enviado', version: 1, caption: form.caption.trim(), preview: TYPE_PREVIEW[form.type] ?? 'gold', comments: [], at: today() }, ...prev])
      toast.success('Material enviado pra aprovação! 📤'); setForm({ title: '', clientId: '', type: 'arte', caption: '' }); setNovo(false); setPending(false)
    }
    if (!isRealData) { done(crypto.randomUUID()); return }
    setPending(true)
    createApproval({ title: form.title, clientId: form.clientId || null, type: form.type, caption: form.caption }).then((r) => {
      if (r.error) { toast.error(r.error); setPending(false); return }
      done((r as unknown as { id?: string }).id ?? crypto.randomUUID())
    })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-brand">Central de Aprovação{!isRealData && ' · demo'}</p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">Aprovações</h1>
          <p className="mt-1 text-sm text-muted-foreground">{pendentes} materiais aguardando ação · versões e comentários registrados.</p>
        </div>
        <button onClick={() => setNovo(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.02] active:scale-95">
          <Upload className="size-4" /> Enviar material
        </button>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={cn('rounded-full border px-3 py-1.5 text-xs font-medium transition-all', filter === f.id ? 'border-brand bg-brand/10 text-brand' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>{f.label}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Upload className="mx-auto mb-3 size-8 text-brand" />
          <p className="font-display text-lg font-bold text-foreground">Nenhum material aqui</p>
          <p className="mt-1 text-sm text-muted-foreground">Envie um material pra aprovação do cliente.</p>
          <button onClick={() => setNovo(true)} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-gold"><Plus className="size-4" /> Enviar material</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((a) => {
            const meta = APPROVAL_STATUS_META[a.status]; const type = APPROVAL_TYPE_META[a.type]
            return (
              <button key={a.id} onClick={() => setSelId(a.id)} className="group animate-rise overflow-hidden rounded-2xl border border-border bg-card text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-brand/30">
                <div className={cn('relative flex h-36 items-center justify-center bg-gradient-to-br', PREVIEW_GRADIENT[a.preview] ?? 'from-zinc-500/40 to-zinc-700/40')}>
                  <span className="text-4xl opacity-90 drop-shadow">{type.emoji}</span>
                  <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">v{a.version}</span>
                  <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">{type.label}</span>
                </div>
                <div className="p-4">
                  <p className="truncate text-sm font-semibold text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.clientName}</p>
                  {a.caption && <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground/80">{a.caption}</p>}
                  <div className="mt-3 flex items-center justify-between">
                    <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', meta.chip)}>{meta.label}</span>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><MessageSquare className="size-3" /> {a.comments.length}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {fmt(a.at)}</span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Detalhe */}
      <Sheet open={!!sel} onOpenChange={(o) => !o && setSelId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {sel && (
            <>
              <SheetHeader className="border-b border-border">
                <SheetTitle>{sel.title}</SheetTitle>
                <SheetDescription>{sel.clientName} · versão {sel.version} · {APPROVAL_TYPE_META[sel.type].label}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4">
                <div className={cn('flex h-44 items-center justify-center rounded-2xl bg-gradient-to-br', PREVIEW_GRADIENT[sel.preview] ?? 'from-zinc-500/40 to-zinc-700/40')}>
                  <span className="text-6xl opacity-90 drop-shadow">{APPROVAL_TYPE_META[sel.type].emoji}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', APPROVAL_STATUS_META[sel.status].chip)}>{APPROVAL_STATUS_META[sel.status].label}</span>
                  <button onClick={() => remove(sel.id)} className="inline-flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-rose-300"><Trash2 className="size-3.5" /> Remover</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setStatus(sel.id, 'aprovado', '🎉 Material aprovado!')} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-500/15 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25"><Check className="size-4" /> Aprovar</button>
                  <button onClick={() => setStatus(sel.id, 'alteracao', 'Alteração solicitada')} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-amber-500/15 text-sm font-semibold text-amber-300 ring-1 ring-amber-500/30 hover:bg-amber-500/25"><RotateCcw className="size-4" /> Alterar</button>
                  <button onClick={() => reenviar(sel)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-secondary text-sm font-semibold text-foreground hover:bg-white/10"><Send className="size-4" /> Reenviar</button>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="kicker mb-2 text-muted-foreground/50">Comentários</p>
                  <div className="space-y-2">
                    {sel.comments.length === 0 && <p className="text-sm text-muted-foreground">Sem comentários ainda.</p>}
                    {sel.comments.map((c) => (
                      <div key={c.id} className={cn('rounded-xl border p-3', c.fromClient ? 'border-sky-500/20 bg-sky-500/[0.06]' : 'border-border bg-white/[0.02]')}>
                        <div className="flex items-center justify-between">
                          <span className={cn('text-xs font-semibold', c.fromClient ? 'text-sky-300' : 'text-foreground')}>{c.author}</span>
                          <span className="text-[10px] text-muted-foreground">{fmt(c.at)}</span>
                        </div>
                        <p className="mt-1 text-sm text-foreground/85">{c.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <input value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addComment(sel.id)} placeholder="Escreva um comentário…" className="h-10 flex-1 rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30" />
                    <button onClick={() => addComment(sel.id)} className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-brand-foreground shadow-gold"><Send className="size-4" /></button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Novo material */}
      <Sheet open={novo} onOpenChange={setNovo}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Enviar material</SheetTitle>
            <SheetDescription>Coloca pra aprovação do cliente.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Título</span>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Logo — proposta A" className={inp} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Cliente</span>
                <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className={inp}>
                  <option value="">— sem cliente —</option>
                  {clientOpts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Tipo</span>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ApprovalType })} className={inp}>
                  {(Object.keys(APPROVAL_TYPE_META) as ApprovalType[]).map((k) => <option key={k} value={k}>{APPROVAL_TYPE_META[k].emoji} {APPROVAL_TYPE_META[k].label}</option>)}
                </select></label>
            </div>
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Descrição (opcional)</span>
              <textarea value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} rows={2} placeholder="O que é esse material…" className="w-full resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30" /></label>
            <button onClick={criar} disabled={pending} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60">
              {pending ? <Loader2 className="size-4 animate-spin" /> : <><Upload className="size-4" /> Enviar pra aprovação</>}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

const inp = 'h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30'
