'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Calendar, MessageSquare, Clock, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

type NotifType = 'agenda' | 'whatsapp' | 'espera'

interface Notif {
  id: string
  type: NotifType
  title: string
  body: string
  time: string
  read: boolean
}

const INITIAL: Notif[] = [
  {
    id: '1', type: 'agenda',
    title: 'Presença confirmada',
    body: 'Mariana Costa confirmou reunião 03/07 às 10:00',
    time: 'agora', read: false,
  },
  {
    id: '2', type: 'whatsapp',
    title: 'Nova mensagem',
    body: 'Dra. Camila: "Confirma o material para o procedimento?"',
    time: '2 min', read: false,
  },
  {
    id: '3', type: 'espera',
    title: 'Vaga disponível',
    body: 'João Silva na fila — horário 09:00 foi liberado',
    time: '5 min', read: false,
  },
  {
    id: '4', type: 'agenda',
    title: 'Encaixe solicitado',
    body: 'Pedro Henrique pede encaixe para hoje à tarde',
    time: '12 min', read: false,
  },
  {
    id: '5', type: 'agenda',
    title: 'Reunião cancelada',
    body: 'Ana Paula cancelou reunião de 04/07 às 14:30',
    time: '28 min', read: true,
  },
  {
    id: '6', type: 'whatsapp',
    title: 'Automação enviada',
    body: 'Lembrete 24h disparado para 8 clientes de amanhã',
    time: '1h', read: true,
  },
]

const TYPE_META: Record<NotifType, {
  icon: React.ElementType
  dot: string
  bg: string
  iconColor: string
}> = {
  agenda:   { icon: Calendar,      dot: 'bg-brand',       bg: 'bg-accent',                     iconColor: 'text-brand' },
  whatsapp: { icon: MessageSquare, dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  espera:   { icon: Clock,         dot: 'bg-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/30',     iconColor: 'text-amber-600 dark:text-amber-400' },
}

export function NotificationBell() {
  const [notifs, setNotifs] = useState<Notif[]>(INITIAL)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const unread = notifs.filter((n) => !n.read).length

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  function markAll() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function markOne(id: string) {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary',
          open && 'bg-secondary text-foreground',
        )}
        aria-label="Notificações"
      >
        <Bell className={cn('size-5', unread > 0 && 'animate-wiggle')} />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex size-[18px] items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold leading-none text-white shadow-sm">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[360px] overflow-hidden rounded-2xl border border-border bg-card shadow-pop animate-rise">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-sm font-semibold text-foreground">Notificações</h3>
              {unread > 0 && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-600 dark:bg-rose-950 dark:text-rose-300">
                  {unread} novas
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="flex items-center gap-1 text-xs text-brand transition-opacity hover:opacity-70"
              >
                <CheckCheck className="size-3.5" />
                Marcar todas
              </button>
            )}
          </div>

          {/* Lista */}
          <ul className="max-h-[400px] divide-y divide-border overflow-y-auto">
            {notifs.map((n) => {
              const M = TYPE_META[n.type]
              const Icon = M.icon
              return (
                <li
                  key={n.id}
                  onClick={() => markOne(n.id)}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/50',
                    !n.read && 'bg-accent/20',
                  )}
                >
                  <span className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg', M.bg)}>
                    <Icon className={cn('size-[15px]', M.iconColor)} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={cn(
                        'truncate text-sm',
                        n.read ? 'font-normal text-foreground' : 'font-medium text-foreground',
                      )}>
                        {n.title}
                      </p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{n.time}</span>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                      {n.body}
                    </p>
                  </div>
                  {!n.read && (
                    <span className={cn('mt-2.5 size-1.5 shrink-0 rounded-full', M.dot)} />
                  )}
                </li>
              )
            })}
          </ul>

          {/* Empty state */}
          {unread === 0 && (
            <div className="flex flex-col items-center gap-1.5 px-4 py-5 text-center">
              <span className="text-xl">✓</span>
              <p className="text-sm font-medium text-foreground">Tudo em dia!</p>
              <p className="text-xs text-muted-foreground">Nenhuma notificação pendente.</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-border px-4 py-3 text-center">
            <button className="text-xs text-brand hover:underline">
              Ver todas as atividades
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
