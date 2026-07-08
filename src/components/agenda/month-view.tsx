'use client'

import { cn } from '@/lib/utils'
import type { DemoEvent } from '@/lib/demo/data'

const WEEK_HEADERS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Matriz de semanas (segunda-início) cobrindo o mês de `ref`. */
function monthMatrix(ref: Date): (Date | null)[][] {
  const year = ref.getFullYear()
  const month = ref.getMonth()
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7 // segunda = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export function MonthView({ date, events = [], onPickDay }: { date: Date; events?: DemoEvent[]; onPickDay: (d: Date) => void }) {
  const weeks = monthMatrix(date)
  const today = new Date()

  // Contagem REAL de eventos por dia (a partir do intervalo do mês).
  const countByDay = new Map<string, number>()
  for (const e of events) if (e.date) countByDay.set(e.date, (countByDay.get(e.date) ?? 0) + 1)
  const count = (d: Date) => countByDay.get(ymd(d)) ?? 0

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="grid grid-cols-7 border-b border-border bg-secondary/40">
        {WEEK_HEADERS.map((h) => (
          <div key={h} className="px-3 py-2 text-center text-[11px] font-semibold text-muted-foreground">{h}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flat().map((d, i) => {
          if (!d) return <div key={i} className="min-h-[84px] border-b border-r border-border/60 bg-secondary/20 sm:min-h-[100px]" />
          const isToday = d.toDateString() === today.toDateString()
          const n = count(d)
          return (
            <button
              key={i}
              onClick={() => onPickDay(d)}
              title={n > 0 ? `${n} evento(s) — abrir o dia` : 'Abrir o dia'}
              className={cn(
                'group flex min-h-[84px] flex-col items-start gap-1 border-b border-r border-border/60 p-2 text-left transition-colors hover:bg-accent/40 sm:min-h-[100px]',
                isToday && 'bg-accent/30',
              )}
            >
              <span className={cn(
                'grid size-6 place-items-center rounded-full text-xs font-medium',
                isToday ? 'bg-brand text-brand-foreground' : 'text-foreground',
              )}>
                {d.getDate()}
              </span>
              {n > 0 && (
                <span className="mt-auto inline-flex items-center gap-1 rounded-full bg-brand/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                  <span className="size-1.5 rounded-full bg-brand" /> {n}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
