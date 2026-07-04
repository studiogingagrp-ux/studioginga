'use client'

import { useMemo, useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight, Plus, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ContentChannel, ContentStatus } from '@/types/database'
import {
  DEMO_POSTS, CHANNEL_META, CONTENT_STATUS_META, CONTENT_STATUS_ORDER, type DemoPost,
} from '@/lib/demo/marketing'
import { DEMO_CLIENTS } from '@/lib/demo/clients'
import { createPost, setPostStatus } from '@/lib/actions/marketing'
import { PageHeader } from '@/components/layout/page-header'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'

const inputCls = 'h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-brand/30'
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

interface Props {
  initialPosts?: DemoPost[]
  isRealData?: boolean
}

export function ContentCalendar({ initialPosts = DEMO_POSTS, isRealData = false }: Props) {
  const [posts, setPosts] = useState<DemoPost[]>(initialPosts)
  const [, startTransition] = useTransition()
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [clientFilter, setClientFilter] = useState<string | null>(null)
  const [selected, setSelected] = useState<DemoPost | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({
    title: '', clientName: DEMO_CLIENTS[0]?.company ?? '',
    channel: 'instagram' as ContentChannel, date: iso(new Date()),
  })

  const clients = useMemo(() => Array.from(new Set(posts.map((p) => p.clientName))), [posts])
  const shown   = clientFilter ? posts.filter((p) => p.clientName === clientFilter) : posts

  // Grade do mês (inclui dias vazios do início)
  const days = useMemo(() => {
    const first = new Date(month)
    const startPad = first.getDay()
    const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    const cells: (string | null)[] = Array(startPad).fill(null)
    for (let i = 1; i <= total; i++) cells.push(iso(new Date(month.getFullYear(), month.getMonth(), i)))
    return cells
  }, [month])

  const monthLabel = month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const today = iso(new Date())

  function shiftMonth(dir: 1 | -1) {
    const d = new Date(month); d.setMonth(d.getMonth() + dir); setMonth(d)
  }

  function advanceStatus(post: DemoPost) {
    const idx = CONTENT_STATUS_ORDER.indexOf(post.status)
    if (idx >= CONTENT_STATUS_ORDER.length - 1) return
    const next = CONTENT_STATUS_ORDER[idx + 1]
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, status: next } : p))
    setSelected((s) => s && s.id === post.id ? { ...s, status: next } : s)
    toast.success(`${post.title} → ${CONTENT_STATUS_META[next].label}`)
    if (isRealData) {
      startTransition(() =>
        setPostStatus(post.id, next).then((r) => { if ('error' in r && r.error) toast.error(r.error) })
      )
    }
  }

  function handleCreatePost() {
    if (!form.title.trim()) { toast.error('Informe o título do post'); return }
    const novo: DemoPost = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      clientName: form.clientName,
      channel: form.channel,
      status: 'rascunho',
      date: form.date,
    }
    setPosts((prev) => [...prev, novo])
    toast.success('Post adicionado ao calendário!')
    setForm({ ...form, title: '' })
    setCreateOpen(false)
    if (isRealData) {
      const clientId = DEMO_CLIENTS.find((c) => c.company === novo.clientName)?.id
      startTransition(() =>
        createPost({ title: novo.title, clientId, channel: novo.channel, date: novo.date })
          .then((r) => {
            if ('error' in r && r.error) { toast.error(r.error); return }
            if ('id' in r && r.id) setPosts((prev) => prev.map((p) => p.id === novo.id ? { ...p, id: r.id! } : p))
          })
      )
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Calendário de conteúdo"
        subtitle="Posts de todos os clientes — do rascunho ao publicado"
        action={
          <button onClick={() => setCreateOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-95">
            <Plus className="size-4" /> Novo post
          </button>
        }
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-border bg-card">
            <button onClick={() => shiftMonth(-1)} className="grid size-9 place-items-center rounded-l-xl text-muted-foreground hover:bg-secondary"><ChevronLeft className="size-4" /></button>
            <button onClick={() => { const d = new Date(); d.setDate(1); setMonth(d) }} className="border-x border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary">Hoje</button>
            <button onClick={() => shiftMonth(1)} className="grid size-9 place-items-center rounded-r-xl text-muted-foreground hover:bg-secondary"><ChevronRight className="size-4" /></button>
          </div>
          <p className="text-sm font-medium capitalize text-foreground">{monthLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="size-3.5 text-muted-foreground" />
          <button onClick={() => setClientFilter(null)}
            className={cn('rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
              !clientFilter ? 'border-brand bg-accent/60 text-accent-foreground' : 'border-border bg-card text-muted-foreground hover:bg-secondary')}>
            Todos
          </button>
          {clients.map((c) => (
            <button key={c} onClick={() => setClientFilter(clientFilter === c ? null : c)}
              className={cn('rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                clientFilter === c ? 'border-brand bg-accent/60 text-accent-foreground' : 'border-border bg-card text-foreground hover:bg-secondary')}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Legenda de status */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        {CONTENT_STATUS_ORDER.map((s) => (
          <span key={s} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <span className={cn('size-1.5 rounded-full', CONTENT_STATUS_META[s].dot)} /> {CONTENT_STATUS_META[s].label}
          </span>
        ))}
      </div>

      {/* Grade do mês */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map((w) => (
            <div key={w} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayPosts = day ? shown.filter((p) => p.date === day) : []
            const isToday = day === today
            return (
              <div key={i} className={cn('min-h-[92px] border-b border-r border-border/60 p-1.5 [&:nth-child(7n)]:border-r-0', !day && 'bg-secondary/20')}>
                {day && (
                  <>
                    <span className={cn(
                      'grid size-6 place-items-center rounded-full text-[11px] font-medium',
                      isToday ? 'bg-brand-gradient font-semibold text-brand-foreground' : 'text-muted-foreground',
                    )}>
                      {Number(day.split('-')[2])}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayPosts.map((p) => (
                        <button key={p.id} onClick={() => setSelected(p)}
                          className="flex w-full items-center gap-1 rounded-lg border border-border bg-card px-1.5 py-1 text-left shadow-soft transition-shadow hover:shadow-card">
                          <span className={cn('size-1.5 shrink-0 rounded-full', CONTENT_STATUS_META[p.status].dot)} />
                          <span className="shrink-0 text-[11px]">{CHANNEL_META[p.channel].emoji}</span>
                          <span className="truncate text-[11px] font-medium text-foreground">{p.title}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Detalhe do post */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          {selected && (
            <>
              <SheetHeader className="border-b border-border">
                <SheetTitle>{selected.title}</SheetTitle>
                <SheetDescription>
                  {selected.clientName} · {CHANNEL_META[selected.channel].emoji} {CHANNEL_META[selected.channel].label} · {new Date(`${selected.date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4">
                {/* Trilha de status */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fluxo de aprovação</p>
                  <div className="space-y-1.5">
                    {CONTENT_STATUS_ORDER.map((s, i) => {
                      const reached = CONTENT_STATUS_ORDER.indexOf(selected.status) >= i
                      return (
                        <div key={s} className={cn('flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors',
                          s === selected.status ? 'border-brand bg-accent/50 font-medium text-foreground' : reached ? 'border-border text-muted-foreground' : 'border-border/50 text-muted-foreground/50')}>
                          <span className={cn('size-2 rounded-full', reached ? CONTENT_STATUS_META[s].dot : 'bg-border')} />
                          {CONTENT_STATUS_META[s].label}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              <SheetFooter>
                {selected.status !== 'publicado' && (
                  <button onClick={() => advanceStatus(selected)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.01] active:scale-95">
                    Avançar para {CONTENT_STATUS_META[CONTENT_STATUS_ORDER[CONTENT_STATUS_ORDER.indexOf(selected.status) + 1]].label} →
                  </button>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Novo post */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Novo post</SheetTitle>
            <SheetDescription>Entra como rascunho no dia escolhido.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Título *</span>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus placeholder="Ex: Reel — bastidores" className={inputCls} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Cliente</span>
                <select value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} className={inputCls}>
                  {DEMO_CLIENTS.map((c) => <option key={c.id} value={c.company}>{c.company}</option>)}
                </select></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Canal</span>
                <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value as ContentChannel })} className={inputCls}>
                  {(Object.keys(CHANNEL_META) as ContentChannel[]).map((ch) => (
                    <option key={ch} value={ch}>{CHANNEL_META[ch].emoji} {CHANNEL_META[ch].label}</option>
                  ))}
                </select></label>
            </div>
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Data de publicação</span>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} /></label>
          </div>
          <SheetFooter>
            <button onClick={handleCreatePost}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.01] active:scale-95">
              <Plus className="size-4" /> Adicionar ao calendário
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
