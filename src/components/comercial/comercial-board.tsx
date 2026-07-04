'use client'

import { useMemo, useState } from 'react'
import { Plus, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { KanbanBoard } from '@/components/kanban/kanban-board'
import {
  GINGA_LEADS, STAGE_META, STAGE_ORDER, mx, memberOf, GINGA_TEAM, type DemoLead,
} from '@/lib/demo/agency'
import type { LeadStage } from '@/types/database'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'

const inputCls = 'h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30'

function LeadCard({ l, dragging }: { l: DemoLead; dragging?: boolean }) {
  const m = memberOf(l.memberId)
  const cooling = l.days >= 7 && !['fechado', 'perdido'].includes(l.stage)
  return (
    <div className={cn(
      'rounded-xl border border-border bg-card p-3.5 shadow-soft transition-shadow',
      dragging ? 'shadow-pop ring-2 ring-brand/40' : 'hover:border-brand/30',
      l.stage === 'perdido' && 'opacity-55',
    )}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-semibold leading-tight text-foreground">{l.company}</p>
        {cooling && <span title={`Parado há ${l.days} dias`} className="shrink-0 rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-orange-300">{l.days}d</span>}
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{l.name} · {l.source}</p>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="font-display text-sm font-bold text-foreground tabular">{mx(l.value)}<span className="text-[10px] font-normal text-muted-foreground">/mês</span></span>
        {m && <span title={m.name} className="grid size-6 place-items-center rounded-full text-[10px] font-bold text-black" style={{ backgroundColor: m.color }}>{m.initials}</span>}
      </div>
    </div>
  )
}

export function ComercialBoard() {
  const [leads, setLeads] = useState<DemoLead[]>(GINGA_LEADS)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ company: '', name: '', value: '', memberId: GINGA_TEAM[0]?.id ?? '', source: 'Indicação' })

  const stats = useMemo(() => {
    const abertos = leads.filter((l) => !['fechado', 'perdido'].includes(l.stage))
    return {
      aberto: abertos.reduce((s, l) => s + l.value, 0),
      ganho: leads.filter((l) => l.stage === 'fechado').reduce((s, l) => s + l.value, 0),
    }
  }, [leads])

  const columns = STAGE_ORDER.map((id) => ({ id, label: STAGE_META[id].label, dot: STAGE_META[id].dot }))

  function move(id: string, col: string) {
    const l = leads.find((x) => x.id === id)
    if (!l || l.stage === col) return
    setLeads((prev) => prev.map((x) => x.id === id ? { ...x, stage: col as LeadStage, days: 0 } : x))
    if (col === 'fechado') toast.success(`🎉 ${l.company} fechado — ${mx(l.value)}/mês!`)
    else toast.success(`${l.company} → ${STAGE_META[col as LeadStage].label}`)
  }

  function create() {
    if (!form.company.trim() || !form.name.trim()) { toast.error('Informe empresa e contato'); return }
    const novo: DemoLead = {
      id: crypto.randomUUID(), company: form.company.trim(), name: form.name.trim(),
      phone: '', value: Number(form.value) || 0, stage: 'novo', memberId: form.memberId,
      source: form.source, days: 0,
    }
    setLeads((prev) => [novo, ...prev])
    toast.success(`${novo.company} entrou no pipeline!`)
    setForm({ ...form, company: '', name: '', value: '' })
    setOpen(false)
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-brand">Comercial</p>
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
          <button onClick={() => setOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.02] active:scale-95">
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
        columnHeaderExtra={(_id, items) => {
          const total = items.reduce((s, l) => s + l.value, 0)
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
