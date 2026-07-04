'use client'

import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, CornerDownLeft, CalendarPlus, UserPlus, User, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_SECTIONS, NAV_FOOTER } from '@/lib/constants/nav'
import { DEMO_CLIENTS } from '@/lib/demo/clients'

export interface CmdClient { id: string; name: string; phone: string }

interface CmdItem {
  id: string
  label: string
  group: string
  icon: LucideIcon
  hint?: string
  keywords?: string
  run: () => void
}

/** Evento global para abrir o palette (usado pela busca do topo). */
export function openCommandPalette() {
  window.dispatchEvent(new Event('open-command-palette'))
}

export function CommandPalette({ clients }: { clients?: CmdClient[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // ⌘K / Ctrl+K alterna; Esc fecha; evento global abre.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o) }
      if (e.key === 'Escape') setOpen(false)
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-command-palette', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-command-palette', onOpen)
    }
  }, [])

  const items: CmdItem[] = useMemo(() => {
    const actions: CmdItem[] = [
      { id: 'new-appt', label: 'Novo agendamento', group: 'Ações', icon: CalendarPlus, hint: 'Agenda',     run: () => router.push('/agenda') },
      { id: 'new-pat',  label: 'Novo cliente',    group: 'Ações', icon: UserPlus,     hint: 'Clientes', run: () => router.push('/clientes') },
    ]
    const navItems = [...NAV_SECTIONS.flatMap((s) => s.items), ...NAV_FOOTER]
    const nav: CmdItem[] = navItems.map((n) => ({
      id: 'nav-' + n.href, label: n.label, group: 'Ir para', icon: n.icon, run: () => router.push(n.href),
    }))
    const clientSource = clients?.length ? clients : DEMO_CLIENTS.slice(0, 6)
    const clientItems: CmdItem[] = clientSource.map((p) => ({
      id: 'pat-' + p.id, label: p.name, group: 'Clientes', icon: User, keywords: p.phone, run: () => router.push('/clientes'),
    }))
    return [...actions, ...nav, ...clientItems]
  }, [router, clients])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return items
    return items.filter((i) => i.label.toLowerCase().includes(s) || i.keywords?.includes(s))
  }, [q, items])

  useEffect(() => { setActive(0) }, [q, open])
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 10) }, [open])

  // Navegação por teclado dentro do palette.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(filtered.length - 1, a + 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
      if (e.key === 'Enter') { e.preventDefault(); const it = filtered[active]; if (it) run(it) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, filtered, active]) // eslint-disable-line react-hooks/exhaustive-deps

  function run(it: CmdItem) {
    setOpen(false); setQ('')
    it.run()
  }

  if (!open) return null

  let lastGroup = ''
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="animate-rise relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-popover shadow-pop">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar telas, ações, clientes…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded-md border border-border bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">ESC</kbd>
        </div>

        <ul className="max-h-80 overflow-y-auto p-2">
          {filtered.map((it, idx) => {
            const showGroup = it.group !== lastGroup
            lastGroup = it.group
            const isActive = idx === active
            return (
              <Fragment key={it.id}>
                {showGroup && (
                  <li className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground first:pt-1">{it.group}</li>
                )}
                <li>
                  <button
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => run(it)}
                    className={cn('flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-sm transition-colors', isActive ? 'bg-accent text-accent-foreground' : 'text-foreground')}
                  >
                    <span className={cn('grid size-7 shrink-0 place-items-center rounded-lg', isActive ? 'bg-card text-brand' : 'bg-secondary text-muted-foreground')}>
                      <it.icon className="size-4" />
                    </span>
                    <span className="flex-1 truncate">{it.label}</span>
                    {it.hint && <span className="text-xs text-muted-foreground">{it.hint}</span>}
                    {isActive && <CornerDownLeft className="size-3.5 text-muted-foreground" />}
                  </button>
                </li>
              </Fragment>
            )
          })}
          {filtered.length === 0 && (
            <li className="px-3 py-10 text-center text-sm text-muted-foreground">Nada encontrado para “{q}”.</li>
          )}
        </ul>

        <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><kbd className="rounded border border-border bg-secondary px-1">↑</kbd><kbd className="rounded border border-border bg-secondary px-1">↓</kbd> navegar</span>
          <span className="flex items-center gap-1"><kbd className="rounded border border-border bg-secondary px-1">↵</kbd> abrir</span>
        </div>
      </div>
    </div>
  )
}
