'use client'

import { cn } from '@/lib/utils'

const WEEK_HEADERS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

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

export function MonthView({ date, onPickDay }: { date: Date; onPickDay: (d: Date) => void }) {
  const weeks = monthMatrix(date)
  const today = new Date()

  // Contagem demo de agendamentos por dia (visual determinístico).
  const count = (d: Date) => {
    const day = d.getDate()
    const wd = d.getDay()
    if (wd === 0) return 0 // domingo fechado
    return [12, 8, 24, 16, 6, 4][day % 6]
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="grid grid-cols-7 border-b border-border bg-secondary/40">
        {WEEK_HEADERS.map((h) => (
          <div key={h} className="px-3 py-2 text-center text-[11px] font-semibold text-muted-foreground">{h}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flat().map((d, i) => {
          if (!d) return <div key={i} className="min-h-[92px] border-b border-r border-border/60 bg-secondary/20" />
          const isToday = d.toDateString() === today.toDateString()
          const n = count(d)
          return (
            <button
              key={i}
              onClick={() => onPickDay(d)}
              className={cn(
                'group flex min-h-[92px] flex-col items-start gap-1 border-b border-r border-border/60 p-2 text-left transition-colors hover:bg-accent/40',
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
                <span className="mt-auto inline-flex items-center gap-1 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                  <span className="size-1.5 rounded-full bg-brand" /> {n} eventos
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
