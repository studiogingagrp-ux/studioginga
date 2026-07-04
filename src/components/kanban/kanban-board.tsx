'use client'

import { useState, type ReactNode } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, closestCorners,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { cn } from '@/lib/utils'

export interface KanbanColumn { id: string; label: string; dot?: string }

interface KanbanBoardProps<T extends { id: string }> {
  columns: KanbanColumn[]
  items: T[]
  columnOf: (item: T) => string
  onMove: (id: string, columnId: string) => void
  renderCard: (item: T, dragging?: boolean) => ReactNode
  columnHeaderExtra?: (columnId: string, items: T[]) => ReactNode
  colWidth?: string
  cardWidth?: string
}

export function KanbanBoard<T extends { id: string }>({
  columns, items, columnOf, onMove, renderCard, columnHeaderExtra,
  colWidth = 'w-[288px]', cardWidth = 'w-[272px]',
}: KanbanBoardProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const active = items.find((i) => i.id === activeId)

  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)) }
  function onDragEnd(e: DragEndEvent) {
    setActiveId(null)
    if (!e.over) return
    const col = String(e.over.id).replace('col__', '')
    onMove(String(e.active.id), col)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colItems = items.filter((i) => columnOf(i) === col.id)
          return (
            <Column key={col.id} col={col} count={colItems.length} className={colWidth} extra={columnHeaderExtra?.(col.id, colItems)}>
              {colItems.map((item) => (
                <Draggable key={item.id} id={item.id}>{renderCard(item)}</Draggable>
              ))}
              {colItems.length === 0 && <p className="m-auto py-6 text-center text-[11px] text-muted-foreground/40">Solte aqui</p>}
            </Column>
          )
        })}
      </div>
      <DragOverlay dropAnimation={null}>
        {active ? <div className={cn('cursor-grabbing', cardWidth)}>{renderCard(active, true)}</div> : null}
      </DragOverlay>
    </DndContext>
  )
}

function Column({
  col, count, className, extra, children,
}: {
  col: KanbanColumn; count: number; className: string; extra?: ReactNode; children: ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col__${col.id}` })
  return (
    <div className={cn('flex shrink-0 flex-col', className)}>
      <div className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold text-foreground">
        {col.dot && <span className={cn('size-2 rounded-full', col.dot)} />}
        {col.label}
        <span className="text-muted-foreground/60">({count})</span>
        {extra && <span className="ml-auto">{extra}</span>}
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[160px] flex-1 flex-col gap-2 rounded-2xl border border-dashed border-border bg-white/[0.015] p-2 transition-colors',
          isOver && 'border-brand/50 bg-brand/[0.04]',
        )}
      >
        {children}
      </div>
    </div>
  )
}

function Draggable({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={cn('cursor-grab touch-none active:cursor-grabbing', isDragging && 'opacity-30')}>
      {children}
    </div>
  )
}
