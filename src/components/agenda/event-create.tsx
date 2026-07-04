'use client'

import { useEffect, useState } from 'react'
import { CalendarPlus, User } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { DEMO_MEMBERS, type DemoEvent, type DemoMember } from '@/lib/demo/data'
import { DEMO_CLIENTS, type DemoClient } from '@/lib/demo/clients'
import { TOTAL_SLOTS, timeFromSlotIndex } from '@/lib/agenda/time'
import type { EventType, EventVisibility } from '@/types/database'
import { TYPE_META, TYPE_ORDER } from '@/lib/constants/events'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'

const TIME_OPTIONS = Array.from({ length: TOTAL_SLOTS }, (_, i) => timeFromSlotIndex(i))
const TYPES: { id: EventType; label: string }[] =
  TYPE_ORDER.map((id) => ({ id, label: `${TYPE_META[id].emoji} ${TYPE_META[id].label}` }))
const inputCls = 'h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-brand/30'

export interface CreatePrefill { memberId?: string; start?: string }

export function EventCreate({
  open, onOpenChange, prefill, onCreate, members, clients,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  prefill?: CreatePrefill
  onCreate: (a: DemoEvent) => void
  members?: DemoMember[]
  clients?: DemoClient[]
}) {
  const proList     = members?.length ? members : DEMO_MEMBERS
  const clientList = clients?.length      ? clients      : DEMO_CLIENTS

  const [title, setClientName] = useState('')
  const [clientId, setClientId]     = useState<string | undefined>(undefined)
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [memberId, setMemberId] = useState(proList[0]?.id ?? '')
  const [start, setStart] = useState('09:00')
  const [duration, setDuration] = useState(30)
  const [type, setType] = useState<EventType>('reuniao')
  const [visibility, setVisibility] = useState<EventVisibility>('equipe')

  // Ao abrir, aplica o pré-preenchimento (membro/horário do slot clicado).
  useEffect(() => {
    if (open) {
      setMemberId(prefill?.memberId ?? proList[0]?.id ?? '')
      setStart(prefill?.start ?? '09:00')
      setClientName(''); setClientId(undefined); setPhone(''); setCompany(''); setDuration(30); setType('reuniao'); setVisibility('equipe')
    }
  }, [open, prefill]) // eslint-disable-line react-hooks/exhaustive-deps

  // Autocompletar telefone/convênio ao escolher um cliente existente.
  function pickClient(name: string) {
    setClientName(name)
    const p = clientList.find((x) => x.name.toLowerCase() === name.toLowerCase())
    if (p) { setClientId(p.id); setPhone(p.phone); setCompany(p.company) }
    else    { setClientId(undefined) }
  }

  function save() {
    const isBlock = type === 'bloqueio'
    if (!isBlock && !title.trim()) { toast.error('Informe o título ou cliente'); return }
    const novo: DemoEvent = {
      id: crypto.randomUUID(),
      memberId,
      clientId: isBlock ? undefined : clientId,
      title: isBlock ? (title.trim() || 'Bloqueio') : title.trim(),
      phone: phone.replace(/\D/g, ''),
      company: company.trim() || undefined,
      start,
      durationMin: duration,
      status: 'agendado',
      type,
      visibility: type === 'pessoal' ? 'privado' : visibility,
    }
    onCreate(novo)
    toast.success(`Evento criado às ${start}`)
    onOpenChange(false)
  }

  const isBlock = type === 'bloqueio'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <div className="flex items-center gap-2">
            <CalendarPlus className="size-4 text-brand" />
            <SheetTitle>Novo agendamento</SheetTitle>
          </div>
          <SheetDescription>Selecione um cliente existente ou cadastre na hora.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto px-4">
          {/* Tipo */}
          <Field label="Tipo">
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map((t) => (
                <button key={t.id} onClick={() => setType(t.id)}
                  className={cn('rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    type === t.id ? 'border-brand bg-accent/60 text-accent-foreground' : 'border-border text-muted-foreground hover:bg-secondary')}>
                  {t.label}
                </button>
              ))}
            </div>
          </Field>

          {!isBlock && (
            <>
              <Field label="Título / Cliente">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input list="clients-list" value={title} onChange={(e) => pickClient(e.target.value)}
                    placeholder="Ex: Reunião — Café Central" className={cn(inputCls, 'pl-9')} />
                  <datalist id="clients-list">
                    {clientList.map((p) => <option key={p.id} value={p.name} />)}
                  </datalist>
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Telefone (WhatsApp)"><input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="(55) 9..." className={inputCls} /></Field>
                <Field label="Empresa"><input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Cliente / interno" className={inputCls} /></Field>
              </div>
              <Field label="Visibilidade">
                <div className="flex gap-1.5">
                  {([['equipe', '👥 Equipe vê tudo'], ['privado', '🔒 Privado — só eu']] as [EventVisibility, string][]).map(([v, label]) => (
                    <button key={v} onClick={() => setVisibility(v)} type="button"
                      className={cn('rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                        (type === 'pessoal' ? 'privado' : visibility) === v
                          ? 'border-brand bg-accent/60 text-accent-foreground'
                          : 'border-border text-muted-foreground hover:bg-secondary')}>
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
            </>
          )}
          {isBlock && (
            <Field label="Motivo do bloqueio"><input value={title} onChange={(e) => setClientName(e.target.value)} placeholder="Ex: Almoço, Reunião" className={inputCls} /></Field>
          )}

          <Field label="Membro">
            <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className={inputCls}>
              {proList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Horário">
              <select value={start} onChange={(e) => setStart(e.target.value)} className={inputCls}>
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Duração">
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputCls}>
                {[30, 60, 90, 120].map((d) => <option key={d} value={d}>{d} min</option>)}
              </select>
            </Field>
          </div>
        </div>

        <SheetFooter>
          <button onClick={save} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.01] active:scale-95">
            <CalendarPlus className="size-4" /> Criar agendamento
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>{children}</label>
}
