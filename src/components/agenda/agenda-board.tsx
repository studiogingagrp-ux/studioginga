'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCenter, type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { ChevronLeft, ChevronRight, Plus, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { DemoEvent, DemoMember } from '@/lib/demo/data'
import { DEMO_EVENTS, DEMO_MEMBERS, DEMO_CURRENT_MEMBER_ID, maskEvent } from '@/lib/demo/data'
import type { DemoClient } from '@/lib/demo/clients'
import { timeFromSlotIndex } from '@/lib/agenda/time'
import type { EventStatus } from '@/types/database'
import { STATUS_META, STATUS_ORDER } from '@/lib/constants/events'
import { DayView, EventCard } from './day-view'
import { WeekView } from './week-view'
import { MonthView } from './month-view'
import { EventDetails } from './event-details'
import { EventCreate, type CreatePrefill } from './event-create'
import {
  updateEventStatus,
  moveEvent,
  createEvent,
} from '@/lib/actions/events'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

type View = 'dia' | 'semana' | 'mes'
const VIEWS: { id: View; label: string }[] = [
  { id: 'dia', label: 'Dia' }, { id: 'semana', label: 'Semana' }, { id: 'mes', label: 'Mês' },
]

interface Props {
  initialEvents?: DemoEvent[]
  initialMembers?: DemoMember[]
  initialClients?: DemoClient[]
  isRealData?: boolean
  /** Membro logado — eventos privados dos outros viram "Ocupado". */
  currentMemberId?: string
}

export function AgendaBoard({
  initialEvents = DEMO_EVENTS,
  initialMembers = DEMO_MEMBERS,
  initialClients,
  isRealData = false,
  currentMemberId: initialCurrentMemberId = DEMO_CURRENT_MEMBER_ID,
}: Props) {
  // Em modo demo, o seletor "Ver como" permite simular a visão de cada membro.
  const [currentMemberId, setCurrentMemberId] = useState(initialCurrentMemberId)
  const [appts, setAppts] = useState<DemoEvent[]>(initialEvents)
  const [pros]            = useState<DemoMember[]>(initialMembers)
  const [view, setView]   = useState<View>('dia')
  const [date, setDate]   = useState(new Date())
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [activeId, setActiveId]   = useState<string | null>(null)
  const [selected, setSelected]   = useState<DemoEvent | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [prefill, setPrefill]       = useState<CreatePrefill | undefined>(undefined)
  const [, startTransition] = useTransition()

  // Realtime: atualiza status de events quando outro dispositivo muda
  useEffect(() => {
    if (!isRealData || !isSupabaseConfigured()) return
    const supabase = createClient()
    const channel = supabase
      .channel('agenda-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events' }, (payload) => {
        const updated = payload.new as Record<string, unknown>
        setAppts((prev) =>
          prev.map((a) =>
            a.id === updated.id
              ? { ...a, status: updated.status as DemoEvent['status'] }
              : a,
          ),
        )
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, () => {
        // Recarregar é complexo — apenas mostrar toast
        toast.info('Novo agendamento adicionado — recarregue para ver', { duration: 4000 })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'events' }, (payload) => {
        setAppts((prev) => prev.filter((a) => a.id !== payload.old.id))
      })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [isRealData]) // eslint-disable-line react-hooks/exhaustive-deps

  // Carrega events do dia selecionado ao navegar (apenas view dia + dados reais)
  const [loadingDate, setLoadingDate] = useState(false)
  useEffect(() => {
    if (!isRealData || view !== 'dia') return
    const todayStr = new Date().toISOString().split('T')[0]
    const dateStr  = date.toISOString().split('T')[0]
    if (dateStr === todayStr) return // já veio do server
    setLoadingDate(true)
    fetch(`/api/events?date=${dateStr}`)
      .then((r) => r.json())
      .then((d) => { if (d.events) setAppts(d.events as DemoEvent[]) })
      .catch(() => null)
      .finally(() => setLoadingDate(false))
  }, [date, view, isRealData]) // eslint-disable-line react-hooks/exhaustive-deps

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const visiblePros = pros.filter((p) => !hidden.has(p.id))
  // Regra de privacidade aplicada uma única vez, antes de qualquer view.
  const shownAppts  = appts.map((a) => maskEvent(a, currentMemberId))
  const activeAppt  = shownAppts.find((a) => a.id === activeId)
  const proOf       = (id: string) => pros.find((p) => p.id === id)

  function selectGuarded(a: DemoEvent) {
    if (a.masked) { toast.info('Evento privado 🔒 — só o dono vê os detalhes'); return }
    setSelected(a)
  }

  function shift(dir: 1 | -1) {
    const d = new Date(date)
    if (view === 'dia')    d.setDate(d.getDate() + dir)
    else if (view === 'semana') d.setDate(d.getDate() + dir * 7)
    else                   d.setMonth(d.getMonth() + dir)
    setDate(d)
  }

  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)) }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null)
    if (!e.over) return
    const [proId, idxStr] = String(e.over.id).split('__')
    const newStart = timeFromSlotIndex(Number(idxStr))

    setAppts((prev) =>
      prev.map((a) => a.id === e.active.id ? { ...a, memberId: proId, start: newStart } : a),
    )
    const moved = appts.find((a) => a.id === e.active.id)
    if (moved) {
      toast.success(`${moved.title} movido para ${newStart}`)
      if (isRealData) {
        startTransition(() =>
          moveEvent(moved.id, proId, newStart).then((r) => {
            if (r.error) toast.error(r.error)
          })
        )
      }
    }
  }

  function changeStatus(id: string, status: EventStatus) {
    setAppts((prev) => prev.map((a) => a.id === id ? { ...a, status } : a))
    setSelected((s) => s && s.id === id ? { ...s, status } : s)
    toast.success(`Status: ${STATUS_META[status].label}`)
    if (isRealData) {
      startTransition(() =>
        updateEventStatus(id, status).then((r) => {
          if (r.error) toast.error(r.error)
        })
      )
    }
  }

  function openCreate(pre?: CreatePrefill) {
    setPrefill(pre)
    setCreateOpen(true)
  }

  function createAt(proId: string, slotIdx: number) {
    openCreate({ memberId: proId, start: timeFromSlotIndex(slotIdx) })
  }

  function resizeAppt(id: string, durationMin: number) {
    setAppts((prev) => prev.map((a) => a.id === id ? { ...a, durationMin } : a))
  }

  function handleCreate(a: DemoEvent) {
    setAppts((prev) => [...prev, a])
    if (isRealData) {
      const dateStr = date.toISOString().split('T')[0]
      startTransition(() =>
        createEvent({
          memberId: a.memberId,
          clientId:      a.clientId,
          title:    a.title,
          phone:          a.phone,
          date:           dateStr,
          start:          a.start,
          durationMin:    a.durationMin,
          type:           a.type,
          notes:          a.notes,
        }).then((r) => {
          if ('error' in r) toast.error(r.error)
        })
      )
    }
  }

  const longDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(date)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-border bg-card">
            <button onClick={() => shift(-1)} className="grid size-9 place-items-center rounded-l-xl text-muted-foreground hover:bg-secondary">
              <ChevronLeft className="size-4" />
            </button>
            <button onClick={() => setDate(new Date())} className="border-x border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary">
              Hoje
            </button>
            <button onClick={() => shift(1)} className="grid size-9 place-items-center rounded-r-xl text-muted-foreground hover:bg-secondary">
              <ChevronRight className="size-4" />
            </button>
          </div>
          <p className="text-sm font-medium capitalize text-foreground">{longDate}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-border bg-card p-0.5">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  view === v.id ? 'bg-brand-gradient text-brand-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => openCreate()}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-gradient px-3.5 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-95"
          >
            <Plus className="size-4" /> <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      {/* Filtro de equipe + legenda */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="size-3.5 text-muted-foreground" />
          {pros.map((p) => {
            const on = !hidden.has(p.id)
            return (
              <button
                key={p.id}
                onClick={() => setHidden((h) => { const n = new Set(h); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n })}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                  on ? 'border-border bg-card text-foreground' : 'border-transparent bg-secondary text-muted-foreground/60 line-through',
                )}
              >
                <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name.split(' ').slice(0, 2).join(' ')}
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!isRealData && (
            <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              Ver como
              <select
                value={currentMemberId}
                onChange={(e) => setCurrentMemberId(e.target.value)}
                className="h-7 rounded-lg border border-border bg-card px-2 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-brand/30"
              >
                {pros.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}{p.isOwner ? ' (dono)' : ''}</option>
                ))}
              </select>
            </label>
          )}
          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            {STATUS_ORDER.slice(0, 4).map((s) => (
              <span key={s} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className={cn('size-1.5 rounded-full', STATUS_META[s].dot)} /> {STATUS_META[s].label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Views */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        {view === 'dia' && (
          <div className="relative">
            {loadingDate && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/60 backdrop-blur-sm">
                <span className="text-sm text-muted-foreground">Carregando…</span>
              </div>
            )}
            <DayView events={shownAppts} members={visiblePros} currentMemberId={currentMemberId} onSelect={selectGuarded} onCreateAt={createAt} onResize={resizeAppt} />
          </div>
        )}
        {view === 'semana' && <WeekView date={date} events={shownAppts} members={visiblePros} onSelect={selectGuarded} />}
        {view === 'mes'    && <MonthView date={date} onPickDay={(d) => { setDate(d); setView('dia') }} />}
        <DragOverlay dropAnimation={null}>
          {activeAppt ? (
            <div className="w-[190px] cursor-grabbing">
              <EventCard appt={activeAppt} pro={proOf(activeAppt.memberId)} mine={activeAppt.memberId === currentMemberId} dragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <EventDetails
        appt={selected}
        pro={selected ? proOf(selected.memberId) : undefined}
        onClose={() => setSelected(null)}
        onStatusChange={changeStatus}
        onDelete={(id) => { setAppts((prev) => prev.filter((a) => a.id !== id)); setSelected(null) }}
        isRealData={isRealData}
      />

      <EventCreate
        open={createOpen}
        onOpenChange={setCreateOpen}
        prefill={prefill}
        onCreate={handleCreate}
        members={pros}
        clients={initialClients}
      />
    </div>
  )
}
