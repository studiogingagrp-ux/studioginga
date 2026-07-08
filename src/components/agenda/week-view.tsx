'use client'

import { cn } from '@/lib/utils'
import { STATUS_META } from '@/lib/constants/events'
import type { DemoEvent, DemoMember } from '@/lib/demo/data'

const WEEKDAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

/** Datas da semana (segunda a sábado) que contém `ref`. */
function weekDays(ref: Date): Date[] {
  const d = new Date(ref)
  const day = (d.getDay() + 6) % 7 // 0 = segunda
  d.setDate(d.getDate() - day)
  return Array.from({ length: 6 }, (_, i) => {
    const x = new Date(d)
    x.setDate(d.getDate() + i)
    return x
  })
}

export function WeekView({
  date, events, members, onSelect,
}: {
  date: Date
  events: DemoEvent[]
  members: DemoMember[]
  onSelect: (a: DemoEvent) => void
}) {
  const days = weekDays(date)
  const today = new Date()
  const proColor = (id: string) => members.find((p) => p.id === id)?.color ?? '#b08d4e'
  const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const hasRealDates = events.some((e) => e.date)

  // Com dados reais: cada evento vai no seu dia real. Sem data (demo): distribui visual.
  const byDay = (i: number) => {
    if (hasRealDates) {
      const key = ymd(days[i])
      return events.filter((e) => e.date === key).sort((a, b) => a.start.localeCompare(b.start))
    }
    return events.filter((_, idx) => idx % 6 === i).sort((a, b) => a.start.localeCompare(b.start))
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {days.map((d, i) => {
        const isToday = d.toDateString() === today.toDateString()
        const items = byDay(i)
        return (
          <div key={i} className={cn('rounded-2xl border bg-card p-3 shadow-soft', isToday ? 'border-brand/40' : 'border-border')}>
            <div className="mb-2 flex items-baseline justify-between">
              <span className={cn('text-xs font-semibold', isToday ? 'text-brand' : 'text-foreground')}>{WEEKDAYS[i]}</span>
              <span className="text-[11px] text-muted-foreground">{d.getDate()}/{d.getMonth() + 1}</span>
            </div>
            <div className="space-y-1.5">
              {items.length === 0 && <p className="py-3 text-center text-[11px] text-muted-foreground/60">Livre</p>}
              {items.map((a) => {
                const meta = STATUS_META[a.status]
                return (
                  <button
                    key={a.id}
                    onClick={() => onSelect(a)}
                    className="flex w-full items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1.5 text-left transition-colors hover:bg-secondary"
                    style={{ borderLeft: `3px solid ${proColor(a.memberId)}` }}
                  >
                    <span className="font-mono text-[10px] text-muted-foreground">{a.start}</span>
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
