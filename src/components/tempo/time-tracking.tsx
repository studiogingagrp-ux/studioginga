'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Square, Timer, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { GINGA_CLIENTS, GINGA_PROJECTS, GINGA_TEAM, clientOf, memberOf } from '@/lib/demo/agency'

interface Entry {
  id: string; clientId: string; projectId: string | null; memberId: string
  desc: string; seconds: number
}

const fmt = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
const fmtH = (s: number) => `${(s / 3600).toFixed(1)}h`

const SEED: Entry[] = [
  { id: 's1', clientId: 'c1', projectId: 'pr1', memberId: 'g2', desc: 'Manual de marca — cor', seconds: 7200 },
  { id: 's2', clientId: 'c2', projectId: 'pr2', memberId: 'g3', desc: 'Setup de campanha', seconds: 5400 },
  { id: 's3', clientId: 'c4', projectId: 'pr4', memberId: 'g5', desc: 'Gravação institucional', seconds: 10800 },
  { id: 's4', clientId: 'c3', projectId: 'pr3', memberId: 'g4', desc: 'Roteiro dos reels', seconds: 3600 },
  { id: 's5', clientId: 'c1', projectId: 'pr1', memberId: 'g5', desc: 'Edição de vídeo', seconds: 4500 },
]

export function TimeTracking() {
  const [entries, setEntries] = useState<Entry[]>(SEED)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [form, setForm] = useState({ clientId: 'c1', projectId: '' as string, memberId: 'g1', desc: '' })
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  function start() {
    if (!form.desc.trim()) { toast.error('Descreva o que está fazendo'); return }
    setRunning(true)
    timer.current = setInterval(() => setElapsed((e) => e + 1), 1000)
  }
  function stop() {
    if (timer.current) clearInterval(timer.current)
    setRunning(false)
    if (elapsed > 0) {
      setEntries((prev) => [{ id: Math.random().toString(36).slice(2), clientId: form.clientId, projectId: form.projectId || null, memberId: form.memberId, desc: form.desc.trim(), seconds: elapsed }, ...prev])
      toast.success(`⏱ ${fmt(elapsed)} registrado!`)
    }
    setElapsed(0)
    setForm({ ...form, desc: '' })
  }

  const total = entries.reduce((s, e) => s + e.seconds, 0) + elapsed
  const porCliente = GINGA_CLIENTS.map((c) => ({ c, s: entries.filter((e) => e.clientId === c.id).reduce((a, e) => a + e.seconds, 0) }))
    .filter((x) => x.s > 0).sort((a, b) => b.s - a.s)
  const maxCliente = Math.max(1, ...porCliente.map((x) => x.s))
  const projetosDoCliente = GINGA_PROJECTS.filter((p) => p.clientId === form.clientId)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="kicker text-brand">Produtividade</p>
        <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">Time Tracking</h1>
        <p className="mt-1 text-sm text-muted-foreground">Hora por cliente, projeto e pessoa — pra cobrar certo e enxergar a rentabilidade.</p>
      </header>

      {/* Cronômetro */}
      <div className="rounded-2xl border border-brand/25 bg-gradient-to-br from-brand/[0.06] to-card p-5 shadow-card">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Sel label="Cliente" value={form.clientId} onChange={(v) => setForm({ ...form, clientId: v, projectId: '' })} opts={GINGA_CLIENTS.map((c) => [c.id, c.name])} />
            <Sel label="Projeto" value={form.projectId} onChange={(v) => setForm({ ...form, projectId: v })} opts={[['', 'Sem projeto'], ...projetosDoCliente.map((p) => [p.id, p.name] as [string, string])]} />
            <Sel label="Pessoa" value={form.memberId} onChange={(v) => setForm({ ...form, memberId: v })} opts={GINGA_TEAM.map((m) => [m.id, m.name.split(' ')[0]])} />
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">O que está fazendo</span>
              <input value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="Ex: edição de reels" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30" /></label>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn('font-display text-2xl font-extrabold tabular', running ? 'text-brand' : 'text-muted-foreground')}>{fmt(elapsed)}</span>
            {!running
              ? <button onClick={start} className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.02] active:scale-95"><Play className="size-4" /> Iniciar</button>
              : <button onClick={stop} className="inline-flex h-11 items-center gap-2 rounded-xl bg-rose-500 px-5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-95"><Square className="size-4" /> Parar</button>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lançamentos */}
        <div className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="kicker text-muted-foreground/50">Lançamentos de hoje</p>
            <p className="text-sm font-semibold text-foreground">Total: <span className="text-brand tabular">{fmtH(total)}</span></p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <ul className="divide-y divide-border">
              {entries.map((e) => {
                const c = clientOf(e.clientId); const m = memberOf(e.memberId)
                const p = e.projectId ? GINGA_PROJECTS.find((x) => x.id === e.projectId) : null
                return (
                  <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                    {m && <span title={m.name} className="grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold text-black" style={{ backgroundColor: m.color }}>{m.initials}</span>}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{e.desc}</p>
                      <p className="truncate text-xs text-muted-foreground">{c?.name}{p ? ` · ${p.name}` : ''}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 font-mono text-sm text-foreground tabular"><Clock className="size-3.5 text-muted-foreground" />{fmt(e.seconds)}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        {/* Por cliente */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="kicker flex items-center gap-1.5 text-muted-foreground/50"><Timer className="size-3.5" /> Horas por cliente</p>
          <div className="mt-3 space-y-3">
            {porCliente.map(({ c, s }) => (
              <div key={c.id}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="truncate text-sm text-foreground">{c.name}</span>
                  <span className="font-mono text-xs text-muted-foreground tabular">{fmtH(s)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${(s / maxCliente) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Sel({ label, value, onChange, opts }: { label: string; value: string; onChange: (v: string) => void; opts: [string, string][] }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30">
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  )
}
