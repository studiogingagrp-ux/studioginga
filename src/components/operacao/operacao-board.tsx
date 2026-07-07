'use client'

import { useMemo, useState } from 'react'
import { Plus, CalendarDays, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { KanbanBoard } from '@/components/kanban/kanban-board'
import {
  GINGA_TASKS, GINGA_CLIENTS, GINGA_TEAM, OP_STATUS_META, OP_STATUS_ORDER,
  OP_TYPE_META, PRIORITY_META, clientOf, memberOf,
} from '@/lib/demo/agency'
import type { OpTaskStatus, OpTaskType, Priority } from '@/types/database'
import { createTask, moveTask, removeTask } from '@/lib/actions/tasks'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'

const inputCls = 'h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30'

export interface TaskRow { id: string; title: string; clientId: string | null; memberId: string | null; type: OpTaskType; status: OpTaskStatus; priority: Priority; due: string | null }
export interface Opt { id: string; name: string }
export interface MemberOpt { id: string; name: string; color: string; initials: string }

const isLateStr = (due: string | null, done: boolean) => !!due && !done && due < new Date().toISOString().split('T')[0]

const DEMO_TASKS: TaskRow[] = GINGA_TASKS.map((t) => ({ id: t.id, title: t.title, clientId: t.clientId, memberId: t.memberId, type: t.type, status: t.status, priority: t.priority, due: t.due }))
const DEMO_CLIENTS: Opt[] = GINGA_CLIENTS.map((c) => ({ id: c.id, name: c.name }))
const DEMO_MEMBERS: MemberOpt[] = GINGA_TEAM.map((m) => ({ id: m.id, name: m.name, color: m.color, initials: m.initials }))

export function OperacaoBoard({ initialTasks, clients, members, isRealData }: { initialTasks?: TaskRow[] | null; clients?: Opt[]; members?: MemberOpt[]; isRealData?: boolean }) {
  const [tasks, setTasks] = useState<TaskRow[]>(initialTasks ?? DEMO_TASKS)
  const clientOpts = isRealData ? (clients ?? []) : DEMO_CLIENTS
  const memberOpts = isRealData ? (members ?? []) : DEMO_MEMBERS
  const clientsById = useMemo(() => new Map(clientOpts.map((c) => [c.id, c.name])), [clientOpts])
  const membersById = useMemo(() => new Map(memberOpts.map((m) => [m.id, m])), [memberOpts])

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: '', clientId: '', memberId: memberOpts[0]?.id ?? '',
    type: 'arte' as OpTaskType, due: new Date().toISOString().split('T')[0],
  })

  const atrasadas = tasks.filter((t) => t.status !== 'concluido' && isLateStr(t.due, false)).length
  const columns = OP_STATUS_ORDER.map((id) => ({ id, label: OP_STATUS_META[id].label, dot: OP_STATUS_META[id].dot }))

  function move(id: string, col: string) {
    const t = tasks.find((x) => x.id === id)
    if (!t || t.status === col) return
    setTasks((prev) => prev.map((x) => x.id === id ? { ...x, status: col as OpTaskStatus } : x))
    toast.success(col === 'concluido' ? `✅ ${t.title} concluída!` : `${t.title} → ${OP_STATUS_META[col as OpTaskStatus].label}`)
    if (isRealData) moveTask(id, col as OpTaskStatus).then((r) => { if (r.error) toast.error(r.error) })
  }

  function create() {
    if (!form.title.trim()) { toast.error('Informe o título da tarefa'); return }
    const base: Omit<TaskRow, 'id'> = { title: form.title.trim(), clientId: form.clientId || null, memberId: form.memberId || null, type: form.type, status: 'a_fazer', priority: 'media', due: form.due || null }
    const done = (id: string) => {
      setTasks((prev) => [{ id, ...base }, ...prev])
      toast.success('Tarefa criada!')
      setForm({ ...form, title: '' }); setOpen(false)
    }
    if (!isRealData) { done(crypto.randomUUID()); return }
    createTask({ title: base.title, clientId: base.clientId, memberId: base.memberId, type: base.type, due: base.due }).then((r) => {
      if (r.error) { toast.error(r.error); return }
      done((r as unknown as { id?: string }).id ?? crypto.randomUUID())
    })
  }

  function remove(id: string) {
    setTasks((prev) => prev.filter((x) => x.id !== id))
    if (isRealData) removeTask(id).then((r) => { if (r.error) toast.error(r.error) })
  }

  function TaskCard({ t, dragging }: { t: TaskRow; dragging?: boolean }) {
    const clientName = isRealData ? clientsById.get(t.clientId ?? '') : clientOf(t.clientId)?.name
    const m = isRealData ? membersById.get(t.memberId ?? '') : (() => { const mm = memberOf(t.memberId); return mm ? { name: mm.name, color: mm.color, initials: mm.initials } : undefined })()
    const done = t.status === 'concluido'
    const late = isLateStr(t.due, done)
    const type = OP_TYPE_META[t.type]
    const dueTxt = t.due ? (t.due === new Date().toISOString().split('T')[0] ? 'Hoje' : new Date(`${t.due}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })) : '—'
    return (
      <div className={cn('group rounded-xl border border-border bg-card p-3.5 shadow-soft transition-shadow', dragging ? 'shadow-pop ring-2 ring-brand/40' : 'hover:border-brand/30', done && 'opacity-65')}>
        <div className="flex items-center gap-1.5">
          <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{type.emoji} {type.label}</span>
          {clientName && <span className="truncate rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">{clientName}</span>}
          <button onClick={() => remove(t.id)} className="ml-auto text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/50 hover:!text-rose-300" title="Remover"><Trash2 className="size-3" /></button>
        </div>
        <p className={cn('mt-2 text-[13px] font-medium leading-snug text-foreground', done && 'text-muted-foreground line-through')}>{t.title}</p>
        <div className="mt-2.5 flex items-center justify-between">
          <span className={cn('inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold', late ? 'bg-rose-500/15 text-rose-300' : 'bg-secondary text-muted-foreground')}>
            <CalendarDays className="size-3" /> {late ? `Atrasada · ${dueTxt}` : dueTxt}
          </span>
          <div className="flex items-center gap-1.5">
            <span className={cn('size-1.5 rounded-full', PRIORITY_META[t.priority].dot)} title={PRIORITY_META[t.priority].label} />
            {m && <span title={m.name} className="grid size-6 place-items-center rounded-full text-[10px] font-bold text-black" style={{ backgroundColor: m.color }}>{m.initials}</span>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-brand">Operação{!isRealData && ' · demo'}</p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">Kanban da equipe</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {atrasadas > 0 ? <>{atrasadas} tarefa{atrasadas > 1 ? 's' : ''} atrasada{atrasadas > 1 ? 's' : ''} — arraste conforme avança.</> : 'Arraste os cards conforme a tarefa avança.'}
          </p>
        </div>
        <button onClick={() => { setForm((f) => ({ ...f, memberId: f.memberId || memberOpts[0]?.id || '' })); setOpen(true) }} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.02] active:scale-95">
          <Plus className="size-4" /> Nova tarefa
        </button>
      </header>

      <KanbanBoard
        columns={columns}
        items={tasks}
        columnOf={(t) => t.status}
        onMove={move}
        renderCard={(t, dragging) => <TaskCard t={t} dragging={dragging} />}
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Nova tarefa</SheetTitle>
            <SheetDescription>Entra em &quot;A fazer&quot; — depois é só arrastar.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Título *</span>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus placeholder="Ex: Roteiro dos reels de agosto" className={inputCls} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Cliente</span>
                <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className={inputCls}>
                  <option value="">— sem cliente —</option>
                  {clientOpts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Responsável</span>
                <select value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })} className={inputCls}>
                  {memberOpts.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Tipo</span>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as OpTaskType })} className={inputCls}>
                  {(Object.keys(OP_TYPE_META) as OpTaskType[]).map((k) => <option key={k} value={k}>{OP_TYPE_META[k].emoji} {OP_TYPE_META[k].label}</option>)}
                </select></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Prazo</span>
                <input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} className={inputCls} /></label>
            </div>
          </div>
          <SheetFooter>
            <button onClick={create} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.01] active:scale-95">
              <Plus className="size-4" /> Criar tarefa
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
