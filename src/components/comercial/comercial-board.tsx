'use client'

import { useMemo, useState } from 'react'
import { Plus, TrendingUp, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { KanbanBoard } from '@/components/kanban/kanban-board'
import { GINGA_LEADS, STAGE_META, STAGE_ORDER, mx, memberOf, GINGA_TEAM } from '@/lib/demo/agency'
import type { LeadStage } from '@/types/database'
import { createLead, moveLead, removeLead } from '@/lib/actions/leads'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'

const inputCls = 'h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30'

export interface LeadRow { id: string; company: string; name: string; value: number; stage: LeadStage; memberId: string | null; source: string; days: number }
export interface MemberOpt { id: string; name: string; color: string; initials: string }

const DEMO_LEADS: LeadRow[] = GINGA_LEADS.map((l) => ({ id: l.id, company: l.company, name: l.name, value: l.value, stage: l.stage, memberId: l.memberId, source: l.source, days: l.days }))
const DEMO_MEMBERS: MemberOpt[] = GINGA_TEAM.map((m) => ({ id: m.id, name: m.name, color: m.color, initials: m.initials }))

export function ComercialBoard({ initialLeads, members, isRealData }: { initialLeads?: LeadRow[] | null; members?: MemberOpt[]; isRealData?: boolean }) {
  const [leads, setLeads] = useState<LeadRow[]>(initialLeads ?? DEMO_LEADS)
  const memberOpts = isRealData ? (members ?? []) : DEMO_MEMBERS
  const membersById = useMemo(() => new Map(memberOpts.map((m) => [m.id, m])), [memberOpts])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ company: '', name: '', value: '', memberId: memberOpts[0]?.id ?? '', source: 'Indicação' })

  const stats = useMemo(() => {
    const abertos = leads.filter((l) => !['fechado', 'perdido'].includes(l.stage))
    return { aberto: abertos.reduce((s, l) => s + l.value, 0), ganho: leads.filter((l) => l.stage === 'fechado').reduce((s, l) => s + l.value, 0) }
  }, [leads])

  const columns = STAGE_ORDER.map((id) => ({ id, label: STAGE_META[id].label, dot: STAGE_META[id].dot }))

  function move(id: string, col: string) {
    const l = leads.find((x) => x.id === id)
    if (!l || l.stage === col) return
    setLeads((prev) => prev.map((x) => x.id === id ? { ...x, stage: col as LeadStage, days: 0 } : x))
    if (col === 'fechado') toast.success(`🎉 ${l.company} fechado — ${mx(l.value)}/mês!`)
    else toast.success(`${l.company} → ${STAGE_META[col as LeadStage].label}`)
    if (isRealData) moveLead(id, col as LeadStage).then((r) => { if (r.error) toast.error(r.error) })
  }

  function remove(id: string) {
    setLeads((prev) => prev.filter((x) => x.id !== id))
    if (isRealData) removeLead(id).then((r) => { if (r.error) toast.error(r.error) })
  }

  function create() {
    if (!form.company.trim() || !form.name.trim()) { toast.error('Informe empresa e contato'); return }
    const base: Omit<LeadRow, 'id'> = { company: form.company.trim(), name: form.name.trim(), value: Number(form.value) || 0, stage: 'novo', memberId: form.memberId || null, source: form.source, days: 0 }
    const done = (id: string) => {
      setLeads((prev) => [{ id, ...base }, ...prev])
      toast.success(`${base.company} entrou no pipeline!`)
      setForm({ ...form, company: '', name: '', value: '' }); setOpen(false)
    }
    if (!isRealData) { done(crypto.randomUUID()); return }
    createLead({ company: base.company, name: base.name, value: base.value, memberId: base.memberId, source: base.source }).then((r) => {
      if (r.error) { toast.error(r.error); return }
      done((r as unknown as { id?: string }).id ?? crypto.randomUUID())
    })
  }

  function LeadCard({ l, dragging }: { l: LeadRow; dragging?: boolean }) {
    const m = isRealData ? membersById.get(l.memberId ?? '') : (() => { const mm = memberOf(l.memberId); return mm ? { name: mm.name, color: mm.color, initials: mm.initials } : undefined })()
    const cooling = l.days >= 7 && !['fechado', 'perdido'].includes(l.stage)
    return (
      <div className={cn('group rounded-xl border border-border bg-card p-3.5 shadow-soft transition-shadow', dragging ? 'shadow-pop ring-2 ring-brand/40' : 'hover:border-brand/30', l.stage === 'perdido' && 'opacity-55')}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] font-semibold leading-tight text-foreground">{l.company}</p>
          <div className="flex shrink-0 items-center gap-1">
            {cooling && <span title={`Parado há ${l.days} dias`} className="rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-orange-300">{l.days}d</span>}
            <button onClick={() => remove(l.id)} className="text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/40 hover:!text-rose-300" title="Remover"><Trash2 className="size-3" /></button>
          </div>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{l.name} · {l.source}</p>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="font-display text-sm font-bold text-foreground tabular">{mx(l.value)}<span className="text-[10px] font-normal text-muted-foreground">/mês</span></span>
          {m && <span title={m.name} className="grid size-6 place-items-center rounded-full text-[10px] font-bold text-black" style={{ backgroundColor: m.color }}>{m.initials}</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-brand">Comercial{!isRealData && ' · demo'}</p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">Pipeline de vendas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Do primeiro lead ao contrato — arraste conforme evolui.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-border bg-card px-4 py-2.5">
            <p className="kicker text-muted-foreground/50">Em negociação</p>
            <p className="mt-0.5 font-display text-lg font-extrabold text-foreground tabular">{mx(stats.aberto)}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5">
            <p className="kicker flex items-center gap-1 text-emerald-300"><TrendingUp className="size-3" /> Fechados</p>
            <p className="mt-0.5 font-display text-lg font-extrabold text-emerald-300 tabular">{mx(stats.ganho)}</p>
          </div>
          <button onClick={() => { setForm((f) => ({ ...f, memberId: f.memberId || memberOpts[0]?.id || '' })); setOpen(true) }} className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.02] active:scale-95">
            <Plus className="size-4" /> Novo lead
          </button>
        </div>
      </header>

      <KanbanBoard
        columns={columns}
        items={leads}
        columnOf={(l) => l.stage}
        onMove={move}
        colWidth="w-[260px]"
        cardWidth="w-[244px]"
        renderCard={(l, dragging) => <LeadCard l={l} dragging={dragging} />}
        columnHeaderExtra={(_id, its) => {
          const total = its.reduce((s, l) => s + l.value, 0)
          return total > 0 ? <span className="font-mono text-[11px] text-muted-foreground tabular">{mx(total)}</span> : null
        }}
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Novo lead</SheetTitle>
            <SheetDescription>Entra na coluna &quot;Novo lead&quot; — depois arraste.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Empresa *</span>
              <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} autoFocus placeholder="Ex: Spa Serenity" className={inputCls} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Contato *</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Lucía Fuentes" className={inputCls} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Valor mensal (MX$)</span>
                <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} inputMode="numeric" placeholder="20000" className={inputCls} /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Origem</span>
                <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={inputCls}>
                  {['Indicação', 'Instagram', 'Site', 'LinkedIn', 'Frio'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select></label>
            </div>
            {memberOpts.length > 1 && (
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Responsável</span>
                <select value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })} className={inputCls}>
                  {memberOpts.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select></label>
            )}
          </div>
          <SheetFooter>
            <button onClick={create} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.01] active:scale-95">
              <Plus className="size-4" /> Adicionar ao pipeline
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
