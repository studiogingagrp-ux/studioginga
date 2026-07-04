'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, closestCenter,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { Plus, TrendingUp, Flame, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatPhone } from '@/lib/utils'
import type { LeadStage } from '@/types/database'
import { DEMO_LEADS, STAGE_META, STAGE_ORDER, type DemoLead } from '@/lib/demo/marketing'
import { DEMO_MEMBERS } from '@/lib/demo/data'
import { createLead, moveLeadStage } from '@/lib/actions/marketing'
import { PageHeader } from '@/components/layout/page-header'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'

const inputCls = 'h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-brand/30'
const mx = (v: number) => `MX$ ${v.toLocaleString('es-MX')}`

function LeadCard({ lead, dragging }: { lead: DemoLead; dragging?: boolean }) {
  const member = DEMO_MEMBERS.find((m) => m.id === lead.memberId)
  const cooling = lead.days >= 7 && lead.stage !== 'fechado' && lead.stage !== 'perdido'
  return (
    <div className={cn(
      'rounded-xl border border-border bg-card p-3.5 shadow-soft transition-shadow',
      dragging ? 'shadow-pop ring-2 ring-brand/40' : 'hover:shadow-card',
      lead.stage === 'perdido' && 'opacity-60',
    )}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-semibold leading-tight text-foreground">{lead.company}</p>
        {cooling && (
          <span title={`Parado há ${lead.days} dias`} className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-600">
            <Flame className="size-3" /> {lead.days}d
          </span>
        )}
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{lead.name}</p>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="font-heading text-sm font-semibold text-foreground">{mx(lead.value)}<span className="text-[10px] font-normal text-muted-foreground">/mês</span></span>
        {member && (
          <span title={member.name} className="grid size-6 place-items-center rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: member.color }}>
            {member.initials}
          </span>
        )}
      </div>
    </div>
  )
}

function DraggableLead({ lead, onSelect }: { lead: DemoLead; onSelect: (l: DemoLead) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}
      onClick={() => onSelect(lead)}
      className={cn('cursor-grab touch-none active:cursor-grabbing', isDragging && 'opacity-30')}>
      <LeadCard lead={lead} />
    </div>
  )
}

function StageColumn({ stage, leads, onSelect }: { stage: LeadStage; leads: DemoLead[]; onSelect: (l: DemoLead) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage__${stage}` })
  const meta = STAGE_META[stage]
  const total = leads.reduce((s, l) => s + l.value, 0)
  return (
    <div className="flex w-[260px] shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
          <span className={cn('size-2 rounded-full', meta.dot)} />
          <span className={meta.header}>{meta.label}</span>
          <span className="text-muted-foreground/70">({leads.length})</span>
        </span>
        {total > 0 && <span className="text-[11px] font-medium text-muted-foreground">{mx(total)}</span>}
      </div>
      <div ref={setNodeRef}
        className={cn('flex min-h-[160px] flex-1 flex-col gap-2 rounded-2xl border border-dashed border-border/70 bg-secondary/30 p-2 transition-colors', isOver && 'border-brand/50 bg-accent/40')}>
        {leads.map((l) => <DraggableLead key={l.id} lead={l} onSelect={onSelect} />)}
        {leads.length === 0 && (
          <p className="m-auto py-6 text-center text-[11px] text-muted-foreground/50">Arraste um card<br />para cá</p>
        )}
      </div>
    </div>
  )
}

interface Props {
  initialLeads?: DemoLead[]
  isRealData?: boolean
}

export function PipelineBoard({ initialLeads = DEMO_LEADS, isRealData = false }: Props) {
  const [leads, setLeads] = useState<DemoLead[]>(initialLeads)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selected, setSelected] = useState<DemoLead | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ company: '', name: '', phone: '', value: '' })
  const [, startTransition] = useTransition()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const active = leads.find((l) => l.id === activeId)

  const stats = useMemo(() => {
    const open = leads.filter((l) => !['fechado', 'perdido'].includes(l.stage))
    const won  = leads.filter((l) => l.stage === 'fechado')
    return {
      openValue: open.reduce((s, l) => s + l.value, 0),
      openCount: open.length,
      wonValue:  won.reduce((s, l) => s + l.value, 0),
      wonCount:  won.length,
    }
  }, [leads])

  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)) }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null)
    if (!e.over) return
    const stage = String(e.over.id).replace('stage__', '') as LeadStage
    const lead = leads.find((l) => l.id === e.active.id)
    if (!lead || lead.stage === stage) return
    setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, stage, days: 0 } : l))
    if (stage === 'fechado') toast.success(`🎉 ${lead.company} fechado — ${mx(lead.value)}/mês!`)
    else toast.success(`${lead.company} → ${STAGE_META[stage].label}`)
    if (isRealData) {
      startTransition(() =>
        moveLeadStage(lead.id, stage).then((r) => { if ('error' in r && r.error) toast.error(r.error) })
      )
    }
  }

  function handleCreateLead() {
    if (!form.company.trim() || !form.name.trim()) { toast.error('Informe empresa e contato'); return }
    const novo: DemoLead = {
      id: crypto.randomUUID(),
      company: form.company.trim(),
      name: form.name.trim(),
      phone: form.phone.replace(/\D/g, ''),
      value: Number(form.value) || 0,
      stage: 'novo',
      memberId: 'm1',
      days: 0,
    }
    setLeads((prev) => [novo, ...prev])
    toast.success(`${novo.company} adicionado ao pipeline!`)
    setForm({ company: '', name: '', phone: '', value: '' })
    setCreateOpen(false)
    if (isRealData) {
      startTransition(() =>
        createLead({ name: novo.name, company: novo.company, phone: novo.phone, value: novo.value })
          .then((r) => {
            if ('error' in r && r.error) { toast.error(r.error); return }
            if ('id' in r && r.id) setLeads((prev) => prev.map((l) => l.id === novo.id ? { ...l, id: r.id! } : l))
          })
      )
    }
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Pipeline comercial"
        subtitle="Arraste os cards entre as etapas — do primeiro contato ao contrato fechado"
        action={
          <button onClick={() => setCreateOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-95">
            <Plus className="size-4" /> Novo lead
          </button>
        }
      />

      {/* Resumo */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:max-w-lg">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs text-muted-foreground">Em negociação ({stats.openCount})</p>
          <p className="mt-1 font-heading text-xl font-semibold text-foreground">{mx(stats.openValue)}<span className="text-xs font-normal text-muted-foreground">/mês</span></p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="flex items-center gap-1 text-xs text-emerald-600"><TrendingUp className="size-3.5" /> Fechados ({stats.wonCount})</p>
          <p className="mt-1 font-heading text-xl font-semibold text-emerald-600">{mx(stats.wonValue)}<span className="text-xs font-normal text-muted-foreground">/mês</span></p>
        </div>
      </div>

      {/* Board */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGE_ORDER.map((stage) => (
            <StageColumn key={stage} stage={stage} leads={leads.filter((l) => l.stage === stage)} onSelect={setSelected} />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {active ? <div className="w-[244px] cursor-grabbing"><LeadCard lead={active} dragging /></div> : null}
        </DragOverlay>
      </DndContext>

      {/* Detalhe do lead */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          {selected && (
            <>
              <SheetHeader className="border-b border-border">
                <SheetTitle>{selected.company}</SheetTitle>
                <SheetDescription>{selected.name} · {STAGE_META[selected.stage].label}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-secondary/50 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Valor estimado</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">{mx(selected.value)}/mês</p>
                  </div>
                  <div className="rounded-xl bg-secondary/50 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">No estágio há</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">{selected.days} dia{selected.days === 1 ? '' : 's'}</p>
                  </div>
                </div>
                {selected.notes && (
                  <div className="rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground">{selected.notes}</div>
                )}
              </div>
              <SheetFooter>
                <a href={`https://wa.me/${selected.phone}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50">
                  <MessageCircle className="size-4" /> Chamar no WhatsApp — {formatPhone(selected.phone)}
                </a>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Novo lead */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Novo lead</SheetTitle>
            <SheetDescription>Entra na coluna &quot;Novo lead&quot; — depois é só arrastar.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Empresa *</span>
              <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} autoFocus placeholder="Ex: Spa Serenity" className={inputCls} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Contato *</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Lucía Fuentes" className={inputCls} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">WhatsApp</span>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" placeholder="+52 1 55..." className={inputCls} /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Valor mensal (MX$)</span>
                <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} inputMode="numeric" placeholder="10000" className={inputCls} /></label>
            </div>
          </div>
          <SheetFooter>
            <button onClick={handleCreateLead}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.01] active:scale-95">
              <Plus className="size-4" /> Adicionar ao pipeline
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
