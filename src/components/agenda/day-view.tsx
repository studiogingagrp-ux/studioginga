'use client'

import { useDraggable, useDroppable } from '@dnd-kit/core'
import { Lock } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { STATUS_META } from '@/lib/constants/events'
import type { DemoEvent, DemoMember } from '@/lib/demo/data'
import {
  SLOT_HEIGHT, TOTAL_SLOTS, hourLabels, slotIndexFromTime, endTime,
} from '@/lib/agenda/time'

export function EventCard({
  appt, pro, mine, compact, dragging,
}: {
  appt: DemoEvent
  pro?: DemoMember
  /** Evento do usuário logado — ganha destaque visual. */
  mine?: boolean
  compact?: boolean
  dragging?: boolean
}) {
  const meta = STATUS_META[appt.status]
  const isBlock = appt.type === 'bloqueio'
  const isPrivate = appt.visibility === 'privado'
  const height = (appt.durationMin / 30) * SLOT_HEIGHT
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-xl border bg-card px-2.5 py-1.5 text-left shadow-soft transition-shadow',
        dragging ? 'shadow-pop ring-2 ring-brand/40' : 'hover:shadow-card',
        isBlock && 'bg-secondary/80',
        appt.masked && 'border-dashed bg-secondary/60',
        mine && !appt.masked && 'ring-1 ring-brand/25 bg-accent/20',
      )}
      style={{ borderLeft: `${mine ? 4 : 3}px solid ${pro?.color ?? '#4f46e5'}`, minHeight: height }}
    >
      <div className="flex items-center gap-1.5">
        {appt.masked || isPrivate
          ? <Lock className="size-3 shrink-0 text-muted-foreground" />
          : <span className={cn('size-2 shrink-0 rounded-full', meta.dot)} />}
        <span className={cn(
          'truncate text-[13px] font-semibold',
          appt.masked ? 'italic text-muted-foreground' : 'text-foreground',
        )}>
          {appt.title}
        </span>
      </div>
      {!compact && height > 40 && (
        <span className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {appt.start}–{endTime(appt.start, appt.durationMin)}
          {appt.company ? ` · ${appt.company}` : ''}
        </span>
      )}
    </div>
  )
}

function DraggableEvent({
  appt, pro, mine, onSelect, onResize,
}: {
  appt: DemoEvent
  pro?: DemoMember
  mine?: boolean
  onSelect: (a: DemoEvent) => void
  onResize: (id: string, durationMin: number) => void
}) {
  // Evento mascarado (privado de outra pessoa) não pode ser arrastado nem redimensionado.
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: appt.id, disabled: appt.masked })
  const top = slotIndexFromTime(appt.start) * SLOT_HEIGHT
  const height = (appt.durationMin / 30) * SLOT_HEIGHT

  function startResize(e: React.PointerEvent) {
    e.stopPropagation()
    e.preventDefault()
    const startY = e.clientY
    const startDur = appt.durationMin
    const move = (ev: PointerEvent) => {
      const slots = Math.round((ev.clientY - startY) / SLOT_HEIGHT)
      const next = Math.max(30, startDur + slots * 30)
      onResize(appt.id, next)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      toast.success('Duração ajustada')
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div
      ref={setNodeRef}
      onClick={() => onSelect(appt)}
      className={cn('group/appt absolute inset-x-1 z-10', isDragging && 'opacity-30')}
      style={{ top: top + 2, height: height - 4 }}
    >
      <div {...listeners} {...attributes} className={cn('h-full touch-none', appt.masked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing')}>
        <EventCard appt={appt} pro={pro} mine={mine} />
      </div>
      {/* Alça de redimensionamento (borda inferior) */}
      {!appt.masked && (
        <div
          onPointerDown={startResize}
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-x-0 bottom-0 z-20 flex h-2.5 cursor-ns-resize items-center justify-center rounded-b-xl opacity-0 transition-opacity group-hover/appt:opacity-100"
        >
          <span className="h-1 w-6 rounded-full bg-foreground/25" />
        </div>
      )}
    </div>
  )
}

function DroppableCell({ proId, idx, onCreate }: { proId: string; idx: number; onCreate: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `${proId}__${idx}` })
  return (
    <div
      ref={setNodeRef}
      onClick={onCreate}
      className={cn(
        'group/cell cursor-pointer border-b border-border/60 transition-colors hover:bg-accent/30',
        idx % 2 === 1 && 'border-b-border',
        isOver && 'bg-accent/60',
      )}
      style={{ height: SLOT_HEIGHT }}
    />
  )
}

export function DayView({
  events, members, currentMemberId, onSelect, onCreateAt, onResize,
}: {
  events: DemoEvent[]
  members: DemoMember[]
  currentMemberId?: string
  onSelect: (a: DemoEvent) => void
  onCreateAt: (proId: string, slotIdx: number) => void
  onResize: (id: string, durationMin: number) => void
}) {
  const labels = hourLabels()

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex min-w-fit">
        {/* Régua de horas */}
        <div className="sticky left-0 z-20 w-16 shrink-0 border-r border-border bg-card">
          <div className="h-12 border-b border-border" />
          <div className="relative" style={{ height: TOTAL_SLOTS * SLOT_HEIGHT }}>
            {labels.map((l) => (
              <div key={l.label} className="absolute right-2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground"
                   style={{ top: l.slot * SLOT_HEIGHT }}>
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Colunas por membro */}
        {members.map((pro) => (
          <div key={pro.id} className="min-w-[200px] flex-1 border-r border-border last:border-r-0">
            <div className="flex h-12 items-center gap-2 border-b border-border px-3">
              <span className="grid size-7 place-items-center rounded-lg text-[11px] font-semibold text-white"
                    style={{ backgroundColor: pro.color }}>
                {pro.initials}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-[13px] font-semibold leading-none text-foreground">
                  {pro.name}
                  {pro.isOwner && (
                    <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-brand">
                      Dono
                    </span>
                  )}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">{pro.jobTitle}</p>
              </div>
            </div>

            <div className="relative" style={{ height: TOTAL_SLOTS * SLOT_HEIGHT }}>
              {/* células dropáveis (fundo) — clique cria agendamento */}
              {Array.from({ length: TOTAL_SLOTS }).map((_, idx) => (
                <DroppableCell key={idx} proId={pro.id} idx={idx} onCreate={() => onCreateAt(pro.id, idx)} />
              ))}
              {/* agendamentos (sobreposição) */}
              {events
                .filter((a) => a.memberId === pro.id)
                .map((a) => (
                  <DraggableEvent key={a.id} appt={a} pro={pro} mine={pro.id === currentMemberId} onSelect={onSelect} onResize={onResize} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
