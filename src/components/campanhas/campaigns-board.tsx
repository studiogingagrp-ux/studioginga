'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, closestCenter,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { Plus, CalendarDays, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { TaskStatus } from '@/types/database'
import { DEMO_TASKS, TASK_STATUS_META, TASK_STATUS_ORDER, type DemoTask } from '@/lib/demo/marketing'
import { DEMO_MEMBERS } from '@/lib/demo/data'
import { DEMO_CLIENTS } from '@/lib/demo/clients'
import { createTask, moveTask } from '@/lib/actions/marketing'
import { PageHeader } from '@/components/layout/page-header'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'

const inputCls = 'h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-brand/30'

function dueLabel(due: string): { text: string; late: boolean; today: boolean } {
  const today = new Date().toISOString().split('T')[0]
  if (due === today) return { text: 'Hoje', late: false, today: true }
  const d = new Date(`${due}T12:00:00`)
  const text = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
  return { text, late: due < today, today: false }
}

function TaskCard({ task, dragging }: { task: DemoTask; dragging?: boolean }) {
  const member = DEMO_MEMBERS.find((m) => m.id === task.memberId)
  const due = dueLabel(task.due)
  const done = task.status === 'concluida'
  return (
    <div className={cn(
      'rounded-xl border border-border bg-card p-3.5 shadow-soft transition-shadow',
      dragging ? 'shadow-pop ring-2 ring-brand/40' : 'hover:shadow-card',
      done && 'opacity-70',
    )}>
      <div className="flex items-center gap-1.5">
        <span className="truncate rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{task.clientName}</span>
        {task.tag && <span className="rounded-full bg-accent/70 px-2 py-0.5 text-[10px] font-medium text-accent-foreground">{task.tag}</span>}
      </div>
      <p className={cn('mt-2 text-[13px] font-medium leading-snug text-foreground', done && 'line-through text-muted-foreground')}>{task.title}</p>
      <div className="mt-2.5 flex items-center justify-between">
        <span className={cn(
          'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
          due.late && !done ? 'bg-red-50 text-red-600' : due.today && !done ? 'bg-amber-50 text-amber-700' : 'bg-secondary text-muted-foreground',
        )}>
          <CalendarDays className="size-3" /> {due.late && !done ? `Atrasada · ${due.text}` : due.text}
        </span>
        {member && (
          <span title={member.name} className="grid size-6 place-items-center rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: member.color }}>
            {member.initials}
          </span>
        )}
      </div>
    </div>
  )
}

function DraggableTask({ task }: { task: DemoTask }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}
      className={cn('cursor-grab touch-none active:cursor-grabbing', isDragging && 'opacity-30')}>
      <TaskCard task={task} />
    </div>
  )
}

function StatusColumn({ status, tasks }: { status: TaskStatus; tasks: DemoTask[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: `status__${status}` })
  const meta = TASK_STATUS_META[status]
  return (
    <div className="flex w-[280px] shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold text-foreground">
        <span className={cn('size-2 rounded-full', meta.dot)} /> {meta.label}
        <span className="text-muted-foreground/70">({tasks.length})</span>
      </div>
      <div ref={setNodeRef}
        className={cn('flex min-h-[180px] flex-1 flex-col gap-2 rounded-2xl border border-dashed border-border/70 bg-secondary/30 p-2 transition-colors', isOver && 'border-brand/50 bg-accent/40')}>
        {tasks.map((t) => <DraggableTask key={t.id} task={t} />)}
        {tasks.length === 0 && <p className="m-auto py-6 text-center text-[11px] text-muted-foreground/50">Nada aqui 🎉</p>}
      </div>
    </div>
  )
}

interface Props {
  initialTasks?: DemoTask[]
  isRealData?: boolean
}

export function CampaignsBoard({ initialTasks = DEMO_TASKS, isRealData = false }: Props) {
  const [tasks, setTasks] = useState<DemoTask[]>(initialTasks)
  const [, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [clientFilter, setClientFilter] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ title: '', clientName: DEMO_CLIENTS[0]?.company ?? '', memberId: DEMO_MEMBERS[0]?.id ?? 'm1', due: new Date().toISOString().split('T')[0], tag: '' })
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const clients = useMemo(() => Array.from(new Set(tasks.map((t) => t.clientName))), [tasks])
  const shown   = clientFilter ? tasks.filter((t) => t.clientName === clientFilter) : tasks
  const active  = tasks.find((t) => t.id === activeId)
  const lateCount = tasks.filter((t) => t.status !== 'concluida' && t.due < new Date().toISOString().split('T')[0]).length

  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)) }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null)
    if (!e.over) return
    const status = String(e.over.id).replace('status__', '') as TaskStatus
    const task = tasks.find((t) => t.id === e.active.id)
    if (!task || task.status === status) return
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status } : t))
    toast.success(status === 'concluida' ? `✅ ${task.title} concluída!` : `${task.title} → ${TASK_STATUS_META[status].label}`)
    if (isRealData) {
      startTransition(() =>
        moveTask(task.id, status).then((r) => { if ('error' in r && r.error) toast.error(r.error) })
      )
    }
  }

  function handleCreateTask() {
    if (!form.title.trim()) { toast.error('Informe o título da tarefa'); return }
    const nova: DemoTask = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      clientName: form.clientName,
      memberId: form.memberId,
      status: 'a_fazer',
      due: form.due,
      tag: form.tag.trim() || undefined,
    }
    setTasks((prev) => [nova, ...prev])
    toast.success('Tarefa criada!')
    setForm({ ...form, title: '', tag: '' })
    setCreateOpen(false)
    if (isRealData) {
      const clientId = DEMO_CLIENTS.find((c) => c.company === nova.clientName)?.id
      startTransition(() =>
        createTask({ title: nova.title, clientId, memberId: nova.memberId, due: nova.due, tag: nova.tag })
          .then((r) => {
            if ('error' in r && r.error) { toast.error(r.error); return }
            if ('id' in r && r.id) setTasks((prev) => prev.map((t) => t.id === nova.id ? { ...t, id: r.id! } : t))
          })
      )
    }
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Campanhas"
        subtitle={lateCount > 0 ? `${lateCount} tarefa${lateCount > 1 ? 's' : ''} atrasada${lateCount > 1 ? 's' : ''} — bora resolver` : 'Tudo em dia por aqui 🚀'}
        action={
          <button onClick={() => setCreateOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-95">
            <Plus className="size-4" /> Nova tarefa
          </button>
        }
      />

      {/* Filtro por cliente */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {TASK_STATUS_ORDER.map((status) => (
            <StatusColumn key={status} status={status} tasks={shown.filter((t) => t.status === status)} />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {active ? <div className="w-[264px] cursor-grabbing"><TaskCard task={active} dragging /></div> : null}
        </DragOverlay>
      </DndContext>

      {/* Nova tarefa */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Nova tarefa</SheetTitle>
            <SheetDescription>Entra em &quot;A fazer&quot; — arraste conforme o progresso.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Título *</span>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus placeholder="Ex: Roteiro dos reels de agosto" className={inputCls} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Cliente</span>
                <select value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} className={inputCls}>
                  {DEMO_CLIENTS.map((c) => <option key={c.id} value={c.company}>{c.company}</option>)}
                </select></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Responsável</span>
                <select value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })} className={inputCls}>
                  {DEMO_MEMBERS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Prazo</span>
                <input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} className={inputCls} /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Etiqueta</span>
                <input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="Conteúdo, Tráfego…" className={inputCls} /></label>
            </div>
          </div>
          <SheetFooter>
            <button onClick={handleCreateTask}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.01] active:scale-95">
              <Plus className="size-4" /> Criar tarefa
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
