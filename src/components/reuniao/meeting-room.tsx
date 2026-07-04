'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Video, MessageCircle, Plus, CheckCircle2, Circle,
  ListChecks, StickyNote, Target, Clock, Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatPhone } from '@/lib/utils'
import { DEMO_EVENTS, DEMO_MEMBERS, type DemoEvent } from '@/lib/demo/data'
import { DEMO_MEETINGS, type DemoMeeting } from '@/lib/demo/marketing'
import { saveMeetingDetail } from '@/lib/actions/marketing'
import type { MeetingAgendaItem, MeetingActionItem, MeetingDetail } from '@/types/database'

const inputCls = 'h-10 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-brand/30'

function useCountdown(start: Date, durationMin: number) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const end = new Date(start.getTime() + durationMin * 60_000)
  if (now >= start && now <= end) return { phase: 'live' as const, label: 'AO VIVO' }
  if (now > end) return { phase: 'done' as const, label: 'Encerrada' }
  const diff = start.getTime() - now.getTime()
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1000)
  const label = h > 0 ? `${h}h ${String(m).padStart(2, '0')}min` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return { phase: 'upcoming' as const, label }
}

export function MeetingRoom({
  eventId, initialDetail = null, isRealData = false,
}: {
  eventId: string
  initialDetail?: MeetingDetail | null
  isRealData?: boolean
}) {
  const event: DemoEvent | undefined = DEMO_EVENTS.find((e) => e.id === eventId)
  const seed: DemoMeeting = useMemo(() => {
    if (initialDetail) {
      return {
        eventId,
        callUrl: initialDetail.call_url ?? undefined,
        agenda: initialDetail.agenda ?? [],
        notes: initialDetail.notes ?? '',
        actions: initialDetail.actions ?? [],
      }
    }
    return DEMO_MEETINGS.find((m) => m.eventId === eventId) ?? { eventId, agenda: [], notes: '', actions: [] }
  }, [eventId, initialDetail])

  const [agenda, setAgenda]   = useState<MeetingAgendaItem[]>(seed.agenda)
  const [notes, setNotes]     = useState(seed.notes)
  const [actions, setActions] = useState<MeetingActionItem[]>(seed.actions)

  // Salvamento automático (debounce) — só com Supabase conectado
  const primeira = useMemo(() => ({ done: false }), [])
  useEffect(() => {
    if (!isRealData) return
    if (!primeira.done) { primeira.done = true; return } // não salva o estado inicial
    const t = setTimeout(() => {
      void saveMeetingDetail(eventId, { agenda, notes, actions, callUrl: seed.callUrl ?? null })
    }, 1200)
    return () => clearTimeout(t)
  }, [agenda, notes, actions, isRealData, eventId, seed.callUrl, primeira])
  const [newTopic, setNewTopic]   = useState('')
  const [newAction, setNewAction] = useState('')
  const [newActionMember, setNewActionMember] = useState(DEMO_MEMBERS[0]?.id ?? 'm1')

  const member = DEMO_MEMBERS.find((m) => m.id === event?.memberId)
  const today = new Date()
  const startDate = useMemo(() => {
    const [h, min] = (event?.start ?? '09:00').split(':').map(Number)
    const d = new Date(today); d.setHours(h, min, 0, 0); return d
  }, [event?.start]) // eslint-disable-line react-hooks/exhaustive-deps

  const countdown = useCountdown(startDate, event?.durationMin ?? 60)

  if (!event) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <p className="text-sm text-muted-foreground">Reunião não encontrada.</p>
        <Link href="/agenda" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">← Voltar para a agenda</Link>
      </div>
    )
  }

  const doneCount = agenda.filter((a) => a.done).length
  const progress  = agenda.length ? Math.round((doneCount / agenda.length) * 100) : 0

  function toggleTopic(id: string) {
    setAgenda((prev) => prev.map((a) => a.id === id ? { ...a, done: !a.done } : a))
  }

  function addTopic() {
    if (!newTopic.trim()) return
    setAgenda((prev) => [...prev, { id: crypto.randomUUID(), text: newTopic.trim(), done: false }])
    setNewTopic('')
  }

  function toggleAction(id: string) {
    setActions((prev) => prev.map((a) => a.id === id ? { ...a, done: !a.done } : a))
  }

  function addAction() {
    if (!newAction.trim()) return
    setActions((prev) => [...prev, { id: crypto.randomUUID(), text: newAction.trim(), member_id: newActionMember, done: false }])
    setNewAction('')
    toast.success('Ação adicionada — vira tarefa na campanha do cliente')
  }

  function summaryText(): string {
    const lines = [
      `📋 *Resumo — ${event!.title}*`,
      `🗓 ${today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${event!.start}`,
      '',
      '*Pauta:*',
      ...agenda.map((a) => `${a.done ? '✅' : '⬜'} ${a.text}`),
    ]
    if (notes.trim()) lines.push('', '*Notas:*', notes.trim())
    if (actions.length) {
      lines.push('', '*Próximos passos:*')
      for (const a of actions) {
        const resp = DEMO_MEMBERS.find((m) => m.id === a.member_id)
        lines.push(`${a.done ? '✅' : '▫️'} ${a.text}${resp ? ` — ${resp.name.split(' ')[0]}` : ''}`)
      }
    }
    lines.push('', '_Atlas Agenda Center_')
    return lines.join('\n')
  }

  function sendSummary() {
    const url = `https://wa.me/${event!.phone || ''}?text=${encodeURIComponent(summaryText())}`
    window.open(url, '_blank', 'noopener')
    toast.success('Resumo pronto no WhatsApp!')
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <Link href="/agenda" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Agenda
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">{event.title}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> Hoje às {event.start} · {event.durationMin} min</span>
              {event.company && <span>· {event.company}</span>}
              {member && (
                <span className="inline-flex items-center gap-1.5">
                  · <span className="grid size-5 place-items-center rounded-full text-[9px] font-semibold text-white" style={{ backgroundColor: member.color }}>{member.initials}</span>
                  {member.name}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold',
              countdown.phase === 'live' ? 'bg-red-50 text-red-600' : countdown.phase === 'done' ? 'bg-secondary text-muted-foreground' : 'bg-accent/70 text-accent-foreground',
            )}>
              {countdown.phase === 'live' && <span className="relative flex size-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex size-2 rounded-full bg-red-500" /></span>}
              {countdown.phase === 'upcoming' ? `Começa em ${countdown.label}` : countdown.label}
            </span>
            {seed.callUrl && countdown.phase !== 'done' && (
              <a href={seed.callUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-95">
                <Video className="size-4" /> Entrar na call
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Pauta */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-2xl border border-border bg-card shadow-soft">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
                <ListChecks className="size-4 text-brand" /> Pauta
              </h2>
              <span className="text-xs font-medium text-muted-foreground">{doneCount}/{agenda.length}</span>
            </div>
            {agenda.length > 0 && (
              <div className="px-5 pt-4">
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-brand-gradient transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
            <ul className="space-y-1 p-4">
              {agenda.map((a) => (
                <li key={a.id}>
                  <button onClick={() => toggleTopic(a.id)}
                    className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-secondary/60', a.done && 'text-muted-foreground')}>
                    {a.done ? <CheckCircle2 className="size-5 shrink-0 text-emerald-500" /> : <Circle className="size-5 shrink-0 text-muted-foreground/40" />}
                    <span className={cn(a.done && 'line-through')}>{a.text}</span>
                  </button>
                </li>
              ))}
              {agenda.length === 0 && <p className="px-3 py-4 text-sm text-muted-foreground">Adicione os tópicos que precisam ser falados.</p>}
            </ul>
            <div className="flex gap-2 border-t border-border p-4">
              <input value={newTopic} onChange={(e) => setNewTopic(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTopic()}
                placeholder="Novo tópico da pauta…" className={inputCls} />
              <button onClick={addTopic} className="grid size-10 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-secondary"><Plus className="size-4" /></button>
            </div>
          </div>

          {/* Notas */}
          <div className="rounded-2xl border border-border bg-card shadow-soft">
            <div className="border-b border-border px-5 py-4">
              <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
                <StickyNote className="size-4 text-brand" /> Notas da reunião
              </h2>
            </div>
            <div className="p-4">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5}
                placeholder="Anote decisões, contexto e combinados enquanto conversa…"
                className="w-full resize-none rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
          </div>
        </div>

        {/* Ações / follow-up */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-card shadow-soft">
            <div className="border-b border-border px-5 py-4">
              <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
                <Target className="size-4 text-brand" /> Próximos passos
              </h2>
            </div>
            <ul className="space-y-1 p-4">
              {actions.map((a) => {
                const resp = DEMO_MEMBERS.find((m) => m.id === a.member_id)
                return (
                  <li key={a.id}>
                    <button onClick={() => toggleAction(a.id)}
                      className={cn('flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-secondary/60', a.done && 'text-muted-foreground')}>
                      {a.done ? <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-emerald-500" /> : <Circle className="mt-0.5 size-4.5 shrink-0 text-muted-foreground/40" />}
                      <span className="min-w-0 flex-1">
                        <span className={cn('block', a.done && 'line-through')}>{a.text}</span>
                        {resp && (
                          <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <span className="grid size-4 place-items-center rounded-full text-[8px] font-semibold text-white" style={{ backgroundColor: resp.color }}>{resp.initials}</span>
                            {resp.name.split(' ')[0]}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
              {actions.length === 0 && <p className="px-3 py-4 text-sm text-muted-foreground">O que ficou combinado? Cada ação tem um responsável.</p>}
            </ul>
            <div className="space-y-2 border-t border-border p-4">
              <input value={newAction} onChange={(e) => setNewAction(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addAction()}
                placeholder="Nova ação…" className={inputCls} />
              <div className="flex gap-2">
                <select value={newActionMember} onChange={(e) => setNewActionMember(e.target.value)} className={cn(inputCls, 'flex-1')}>
                  {DEMO_MEMBERS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <button onClick={addAction} className="grid size-10 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-secondary"><Plus className="size-4" /></button>
              </div>
            </div>
          </div>

          {/* Resumo por WhatsApp */}
          <div className="rounded-2xl border border-brand/30 bg-accent/30 p-5 shadow-soft">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="size-4 text-brand" /> Follow-up em 1 clique
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              O Atlas monta o resumo (pauta ✅, notas e próximos passos) e abre pronto no WhatsApp
              {event.phone ? ` de ${formatPhone(event.phone)}` : ' do cliente'}.
            </p>
            <button onClick={sendSummary}
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.01] active:scale-95">
              <MessageCircle className="size-4" /> Enviar resumo por WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
