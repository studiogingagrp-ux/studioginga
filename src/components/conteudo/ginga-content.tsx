'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { GINGA_POSTS, clientOf } from '@/lib/demo/agency'
import { CHANNEL_META, CONTENT_STATUS_META, CONTENT_STATUS_ORDER } from '@/lib/demo/marketing'
import type { ContentChannel } from '@/types/database'

const WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function GingaContent() {
  const [channel, setChannel] = useState<'todos' | ContentChannel>('todos')
  const now = new Date()
  const year = now.getFullYear(), month = now.getMonth(), todayN = now.getDate()
  const startWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const cells: (number | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const postsOn = (day: number) => GINGA_POSTS.filter((p) => p.day === day && (channel === 'todos' || p.channel === channel))

  const channels = Object.keys(CHANNEL_META) as ContentChannel[]

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-brand">Conteúdo</p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">Calendário editorial</h1>
          <p className="mt-1 text-sm capitalize text-muted-foreground">{monthName} · {GINGA_POSTS.length} publicações planejadas</p>
        </div>
        <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-gold">
          Nova publicação
        </button>
      </header>

      {/* Filtros de canal */}
      <div className="flex flex-wrap gap-1.5">
        <FilterChip active={channel === 'todos'} onClick={() => setChannel('todos')}>Todos</FilterChip>
        {channels.map((ch) => (
          <FilterChip key={ch} active={channel === ch} onClick={() => setChannel(ch)}>
            {CHANNEL_META[ch].emoji} {CHANNEL_META[ch].label}
          </FilterChip>
        ))}
      </div>

      {/* Calendário */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="grid grid-cols-7 border-b border-border">
          {WEEK.map((w) => <div key={w} className="px-2 py-2.5 text-center kicker text-muted-foreground/50">{w}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const posts = day ? postsOn(day) : []
            const isToday = day === todayN
            return (
              <div key={i} className={cn('min-h-[92px] border-b border-r border-border/60 p-1.5 sm:min-h-[110px]', !day && 'bg-white/[0.01]')}>
                {day && (
                  <>
                    <span className={cn('inline-flex size-6 items-center justify-center rounded-full text-xs font-medium', isToday ? 'bg-brand text-brand-foreground font-bold' : 'text-muted-foreground')}>{day}</span>
                    <div className="mt-1 space-y-1">
                      {posts.slice(0, 3).map((p) => {
                        const c = clientOf(p.clientId)
                        const st = CONTENT_STATUS_META[p.status]
                        return (
                          <div key={p.id} title={`${p.title} · ${c?.name}`} className="flex items-center gap-1 rounded-md bg-white/[0.03] px-1 py-0.5">
                            <span className={cn('size-1.5 shrink-0 rounded-full', st.dot)} />
                            <span className="text-[10px]">{CHANNEL_META[p.channel].emoji}</span>
                            <span className="hidden truncate text-[10px] text-muted-foreground sm:inline">{c?.name}</span>
                          </div>
                        )
                      })}
                      {posts.length > 3 && <p className="px-1 text-[10px] text-muted-foreground/60">+{posts.length - 3}</p>}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-4">
        {CONTENT_STATUS_ORDER.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn('size-2 rounded-full', CONTENT_STATUS_META[s].dot)} /> {CONTENT_STATUS_META[s].label}
          </span>
        ))}
      </div>
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn('rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
      active ? 'border-brand bg-brand/10 text-brand' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>
      {children}
    </button>
  )
}
