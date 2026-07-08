'use client'

import { cn } from '@/lib/utils'
import { STATUS_META } from '@/lib/constants/events'
import type { DemoEvent, DemoMember } from '@/lib/demo/data'

const WD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/**
 * Grade de dias (Semana = 7, Quinzena = 15) com os eventos reais de cada dia.
 * Cada card é um dia; os cards rolam/quebram de forma responsiva no mobile.
 */
export function MultiDayView({
  days, events, members, onSelect, onPickDay,
}: {
  days: Date[]
  events: DemoEvent[]
  members: DemoMember[]
  onSelect: (a: DemoEvent) => void
  onPickDay?: (d: Date) => void
}) {
  const today = new Date()
  const proColor = (id: string) => members.find((p) => p.id === id)?.color ?? '#b08d4e'
  const hasRealDates = events.some((e) => e.date)

  const byDay = (d: Date, i: number) => {
    if (hasRealDates) {
      const key = ymd(d)
      return events.filter((e) => e.date === key).sort((a, b) => a.start.localeCompare(b.start))
    }
    // fallback demo (sem data): distribui visualmente
    return events.filter((_, idx) => idx % days.length === i).sort((a, b) => a.start.localeCompare(b.start))
  }

  const cols = days.length <= 7
    ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-7'
    : 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-5'

  return (
    <div className={cn('grid gap-3', cols)}>
      {days.map((d, i) => {
        const isToday = d.toDateString() === today.toDateString()
        const items = byDay(d, i)
        return (
          <div key={i} className={cn('flex min-h-[120px] flex-col rounded-2xl border bg-card p-3 shadow-soft', isToday ? 'border-brand/50 ring-1 ring-brand/20' : 'border-border')}>
            <button
              onClick={() => onPickDay?.(d)}
              className="mb-2 flex items-baseline justify-between text-left"
              disabled={!onPickDay}
            >
              <span className={cn('text-xs font-semibold', isToday ? 'text-brand' : 'text-foreground')}>{WD[d.getDay()]}</span>
              <span className={cn('grid size-6 place-items-center rounded-full text-[11px] font-medium tabular', isToday ? 'bg-brand text-brand-foreground' : 'text-muted-foreground')}>{d.getDate()}</span>
            </button>
            <div className="space-y-1.5">
              {items.length === 0 && <p className="py-3 text-center text-[11px] text-muted-foreground/50">Livre</p>}
              {items.map((a) => {
                const meta = STATUS_META[a.status]
                return (
                  <button
                    key={a.id}
                    onClick={() => onSelect(a)}
                    className="flex w-full items-center gap-1.5 rounded-lg border border-border bg-background/40 px-2 py-1.5 text-left transition-colors hover:bg-secondary"
                    style={{ borderLeft: `3px solid ${proColor(a.memberId)}` }}
                  >
                    <span className="font-mono text-[10px] text-muted-foreground tabular">{a.start}</span>
                    <span className={cn('size-1.5 shrink-0 rounded-full', meta.dot)} />
                    <span className="truncate text-[11px] font-medium text-foreground">{a.title}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
