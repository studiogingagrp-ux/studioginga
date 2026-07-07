'use client'

import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { GINGA_POSTS, GINGA_CLIENTS } from '@/lib/demo/agency'
import { CHANNEL_META, CONTENT_STATUS_META, CONTENT_STATUS_ORDER } from '@/lib/demo/marketing'
import type { ContentChannel, ContentStatus } from '@/types/database'
import { createPost, setPostStatus, removePost } from '@/lib/actions/posts'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'

const WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const inp = 'h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30'

export interface PostRow { id: string; day: number; title: string; clientId: string; channel: ContentChannel; status: ContentStatus }
export interface ClientOpt { id: string; name: string }

const DEMO_POSTS: PostRow[] = GINGA_POSTS.map((p) => ({ id: p.id, day: p.day, title: p.title, clientId: p.clientId, channel: p.channel, status: p.status }))
const DEMO_CLIENTS: ClientOpt[] = GINGA_CLIENTS.map((c) => ({ id: c.id, name: c.name }))

export function GingaContent({ initialPosts, clients, isRealData }: { initialPosts?: PostRow[] | null; clients?: ClientOpt[]; isRealData?: boolean }) {
  const clientList = isRealData ? (clients ?? []) : DEMO_CLIENTS
  const clientById = useMemo(() => new Map(clientList.map((c) => [c.id, c])), [clientList])
  const [posts, setPosts] = useState<PostRow[]>(initialPosts ?? (isRealData ? [] : DEMO_POSTS))
  const [channel, setChannel] = useState<'todos' | ContentChannel>('todos')

  const now = new Date()
  const year = now.getFullYear(), month = now.getMonth(), todayN = now.getDate()
  const startWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const ymd = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const cells: (number | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const filtered = channel === 'todos' ? posts : posts.filter((p) => p.channel === channel)
  const postsOn = (day: number) => filtered.filter((p) => p.day === day)
  const channels = Object.keys(CHANNEL_META) as ContentChannel[]

  // create sheet
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', clientId: clientList[0]?.id ?? '', channel: 'instagram' as ContentChannel, status: 'rascunho' as ContentStatus, day: todayN })
  // detail sheet
  const [sel, setSel] = useState<PostRow | null>(null)

  function openCreate(day?: number) {
    setForm((f) => ({ ...f, title: '', clientId: f.clientId || clientList[0]?.id || '', day: day ?? todayN }))
    setOpen(true)
  }

  function create() {
    if (!form.title.trim()) { toast.error('Informe o título da publicação'); return }
    const base: Omit<PostRow, 'id'> = { day: form.day, title: form.title.trim(), clientId: form.clientId, channel: form.channel, status: form.status }
    const done = (id: string) => {
      setPosts((prev) => [...prev, { id, ...base }])
      toast.success('Publicação adicionada ao calendário!')
      setForm((f) => ({ ...f, title: '' })); setOpen(false)
    }
    if (!isRealData) { done(crypto.randomUUID()); return }
    createPost({ title: base.title, clientId: base.clientId, channel: base.channel, status: base.status, scheduledOn: ymd(base.day) }).then((r) => {
      if (r.error) { toast.error(r.error); return }
      done((r as unknown as { id?: string }).id ?? crypto.randomUUID())
    })
  }

  function cycle(p: PostRow) {
    const next = CONTENT_STATUS_ORDER[(CONTENT_STATUS_ORDER.indexOf(p.status) + 1) % CONTENT_STATUS_ORDER.length]
    setPosts((prev) => prev.map((x) => x.id === p.id ? { ...x, status: next } : x))
    setSel((s) => s && s.id === p.id ? { ...s, status: next } : s)
    toast.success(`${p.title} → ${CONTENT_STATUS_META[next].label}`)
    if (isRealData) setPostStatus(p.id, next).then((r) => { if (r.error) toast.error(r.error) })
  }

  function excluir(p: PostRow) {
    setPosts((prev) => prev.filter((x) => x.id !== p.id))
    setSel(null)
    if (isRealData) removePost(p.id).then((r) => { if (r.error) toast.error(r.error) })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-brand">Conteúdo{!isRealData && ' · demo'}</p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">Calendário editorial</h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground">{monthName} · {posts.length} publicações planejadas</p>
        </div>
        <button onClick={() => openCreate()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.02] active:scale-95">
          <Plus className="size-4" /> Nova publicação
        </button>
      </header>

      {/* Filtros de canal */}
      <div className="flex flex-wrap gap-1.5">
        <FilterChip active={channel === 'todos'} onClick={() => setChannel('todos')}>Todos</FilterChip>
        {channels.map((ch) => (
          <FilterChip key={ch} active={channel === ch} onClick={() => setChannel(ch)}>
            {CHANNEL_META[ch].emoji} {CHANNEL_META[ch].label}
          </FilterChip>
        ))}
      </div>

      {/* Calendário */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="grid grid-cols-7 border-b border-border">
          {WEEK.map((w) => <div key={w} className="px-2 py-2.5 text-center kicker text-muted-foreground/50">{w}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const dayPosts = day ? postsOn(day) : []
            const isToday = day === todayN
            return (
              <div key={i} onClick={() => day && openCreate(day)} className={cn('group min-h-[92px] border-b border-r border-border/60 p-1.5 sm:min-h-[110px]', !day ? 'bg-white/[0.01]' : 'cursor-pointer hover:bg-white/[0.02]')}>
                {day && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className={cn('inline-flex size-6 items-center justify-center rounded-full text-xs font-medium', isToday ? 'bg-brand text-brand-foreground font-bold' : 'text-muted-foreground')}>{day}</span>
                      <Plus className="size-3 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/40" />
                    </div>
                    <div className="mt-1 space-y-1">
                      {dayPosts.slice(0, 3).map((p) => {
                        const c = clientById.get(p.clientId)
                        const st = CONTENT_STATUS_META[p.status]
                        return (
                          <button key={p.id} onClick={(e) => { e.stopPropagation(); setSel(p) }} title={`${p.title} · ${c?.name ?? ''}`} className="flex w-full items-center gap-1 rounded-md bg-white/[0.03] px-1 py-0.5 text-left hover:bg-white/[0.06]">
                            <span className={cn('size-1.5 shrink-0 rounded-full', st.dot)} />
                            <span className="text-[10px]">{CHANNEL_META[p.channel].emoji}</span>
                            <span className="hidden truncate text-[10px] text-muted-foreground sm:inline">{c?.name ?? p.title}</span>
                          </button>
                        )
                      })}
                      {dayPosts.length > 3 && <p className="px-1 text-[10px] text-muted-foreground/60">+{dayPosts.length - 3}</p>}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-4">
        {CONTENT_STATUS_ORDER.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn('size-2 rounded-full', CONTENT_STATUS_META[s].dot)} /> {CONTENT_STATUS_META[s].label}
          </span>
        ))}
      </div>

      {/* CRIAR */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Nova publicação</SheetTitle>
            <SheetDescription>Dia {form.day} · {monthName}</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Título *</span>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus placeholder="Ex: Reel — bastidores" className={inp} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Cliente</span>
              <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className={inp}>
                {clientList.length === 0 && <option value="">Sem clientes</option>}
                {clientList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Canal</span>
                <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value as ContentChannel })} className={inp}>
                  {channels.map((ch) => <option key={ch} value={ch}>{CHANNEL_META[ch].label}</option>)}
                </select></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Dia</span>
                <input type="number" min={1} max={daysInMonth} value={form.day} onChange={(e) => setForm({ ...form, day: Math.min(daysInMonth, Math.max(1, Number(e.target.value) || 1)) })} className={inp} /></label>
            </div>
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Status</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ContentStatus })} className={inp}>
                {CONTENT_STATUS_ORDER.map((s) => <option key={s} value={s}>{CONTENT_STATUS_META[s].label}</option>)}
              </select></label>
          </div>
          <SheetFooter>
            <button onClick={create} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.01] active:scale-95">
              <Plus className="size-4" /> Adicionar
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* DETALHE */}
      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          {sel && (
            <>
              <SheetHeader className="border-b border-border">
                <SheetTitle>{sel.title}</SheetTitle>
                <SheetDescription>{clientById.get(sel.clientId)?.name ?? '—'} · {CHANNEL_META[sel.channel].emoji} {CHANNEL_META[sel.channel].label} · dia {sel.day}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4">
                <div>
                  <span className="mb-2 block text-xs font-medium text-muted-foreground">Status</span>
                  <button onClick={() => cycle(sel)} className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-transform hover:scale-105 active:scale-95', CONTENT_STATUS_META[sel.status].chip)}>
                    <span className={cn('size-2 rounded-full', CONTENT_STATUS_META[sel.status].dot)} /> {CONTENT_STATUS_META[sel.status].label}
                  </button>
                  <p className="mt-1.5 text-[11px] text-muted-foreground/60">Clique para avançar o status.</p>
                </div>
              </div>
              <SheetFooter>
                <button onClick={() => excluir(sel)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 text-sm font-semibold text-rose-300 transition-colors hover:bg-rose-500/20">
                  <Trash2 className="size-4" /> Excluir publicação
                </button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn('rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
      active ? 'border-brand bg-brand/10 text-brand' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>
      {children}
    </button>
  )
}
