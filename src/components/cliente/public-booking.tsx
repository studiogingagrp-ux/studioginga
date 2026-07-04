'use client'

import { useEffect, useState, useTransition } from 'react'
import { ArrowLeft, ArrowRight, Check, CalendarCheck, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/brand/logo'
import { GrpCredit } from '@/components/brand/grp-credit'
import { DEMO_MEMBERS, type DemoMember } from '@/lib/demo/data'
import { createPublicBooking } from '@/lib/actions/public-booking'
import { getBookedSlots } from '@/lib/supabase/public-queries'

function getNextWorkingDays(count: number): { label: string; sub: string; iso: string }[] {
  const out: { label: string; sub: string; iso: string }[] = []
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 1)
  const fmtDay  = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
  const fmtDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
  while (out.length < count) {
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) {
      out.push({
        label: fmtDay.format(d).replace('.', ''),
        sub:   fmtDate.format(d),
        iso:   d.toISOString().split('T')[0],
      })
    }
    d.setDate(d.getDate() + 1)
  }
  return out
}

const DAYS  = getNextWorkingDays(5)
const SLOTS = ['09:00', '09:30', '10:00', '11:00', '14:00', '14:30', '15:00', '16:30']

interface Props {
  members?: DemoMember[]
  workspaceId?: string
  workspaceName?: string
}

export function PublicBooking({ members, workspaceId, workspaceName }: Props) {
  const proList = members?.length ? members : DEMO_MEMBERS
  const isReal  = !!(workspaceId && members?.length)

  const [step, setStep]         = useState(0)
  const [pro,  setPro]          = useState<string | null>(null)
  const [day,  setDay]          = useState<number | null>(null)
  const [slot, setSlot]         = useState<string | null>(null)
  const [name, setName]         = useState('')
  const [phone, setPhone]       = useState('')
  const [company, setCompany]   = useState('')
  const [topic, setTopic]       = useState('')
  const [done, setDone]         = useState(false)
  const [bookedSlots, setBooked] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Carrega slots ocupados ao selecionar membro + dia
  useEffect(() => {
    if (!isReal || pro === null || day === null) { setBooked([]); return }
    setLoadingSlots(true)
    getBookedSlots(workspaceId!, pro, DAYS[day].iso)
      .then(setBooked)
      .finally(() => setLoadingSlots(false))
  }, [pro, day, isReal, workspaceId])

  const proObj  = proList.find((p) => p.id === pro)
  const canNext = [pro !== null, day !== null, slot !== null, name.trim() && phone.trim()][step]

  function handleConfirm() {
    if (!isReal) { setDone(true); return }

    startTransition(async () => {
      const res = await createPublicBooking({
        workspaceId: workspaceId!,
        memberId:    pro!,
        title:       name.trim(),
        phone,
        date:        DAYS[day!].iso,
        time:        slot!,
        company:     company.trim() || undefined,
        topic:       topic.trim() || undefined,
      })
      if (res.error) {
        toast.error(res.error)
      } else {
        setDone(true)
      }
    })
  }

  if (done) {
    return (
      <Shell workspaceName={workspaceName}>
        <div className="animate-rise flex flex-col items-center py-10 text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CalendarCheck className="size-8" />
          </span>
          <h2 className="mt-6 font-heading text-2xl font-semibold tracking-tight text-foreground">
            Reunião confirmada!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {proObj?.name} · {day !== null ? `${DAYS[day].label} ${DAYS[day].sub}` : ''} às {slot}
          </p>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Você receberá a confirmação e o lembrete pelo WhatsApp. Até breve, {name.split(' ')[0]}! 💙
          </p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell workspaceName={workspaceName}>
      {/* Stepper */}
      <div className="mb-6 flex items-center gap-2">
        {['Membro', 'Dia', 'Horário', 'Seus dados'].map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <span className={cn(
              'grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold transition-colors',
              i < step  ? 'bg-brand text-brand-foreground'
                : i === step ? 'bg-brand-gradient text-brand-foreground'
                : 'bg-secondary text-muted-foreground',
            )}>
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </span>
            {i < 3 && (
              <span className={cn('h-0.5 flex-1 rounded-full', i < step ? 'bg-brand' : 'bg-secondary')} />
            )}
          </div>
        ))}
      </div>

      {step === 0 && (
        <Section title="Com quem você quer falar?">
          <div className="space-y-2">
            {proList.map((p) => (
              <button key={p.id} onClick={() => setPro(p.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                  pro === p.id ? 'border-brand bg-accent/50' : 'border-border hover:bg-secondary',
                )}>
                <span className="grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: p.color }}>
                  {p.initials}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.jobTitle}</p>
                </div>
              </button>
            ))}
          </div>
        </Section>
      )}

      {step === 1 && (
        <Section title="Escolha o dia">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {DAYS.map((d, i) => (
              <button key={i} onClick={() => setDay(i)}
                className={cn(
                  'flex flex-col items-center rounded-xl border py-3 transition-colors',
                  day === i ? 'border-brand bg-accent/50' : 'border-border hover:bg-secondary',
                )}>
                <span className="text-xs capitalize text-muted-foreground">{d.label}</span>
                <span className="mt-0.5 text-sm font-semibold text-foreground">{d.sub}</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {step === 2 && (
        <Section title="Escolha o horário">
          {loadingSlots ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {SLOTS.map((s) => {
                const taken = bookedSlots.includes(s)
                return (
                  <button key={s} onClick={() => !taken && setSlot(s)} disabled={taken}
                    className={cn(
                      'rounded-xl border py-2.5 text-sm font-medium transition-colors',
                      taken
                        ? 'cursor-not-allowed border-border bg-secondary/50 text-muted-foreground/50 line-through'
                        : slot === s
                          ? 'border-brand bg-brand-gradient text-brand-foreground'
                          : 'border-border text-foreground hover:bg-secondary',
                    )}>
                    {s}
                  </button>
                )
              })}
            </div>
          )}
        </Section>
      )}

      {step === 3 && (
        <Section title="Seus dados">
          <div className="space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-brand/30" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              inputMode="tel" placeholder="WhatsApp com DDI — +52 1 55 9999-9999"
              className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-brand/30" />
            <div className="grid grid-cols-2 gap-3">
              <input value={company} onChange={(e) => setCompany(e.target.value)}
                placeholder="Empresa (opcional)"
                className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-brand/30" />
              <input value={topic} onChange={(e) => setTopic(e.target.value)}
                placeholder="Assunto (opcional)"
                className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
            <div className="rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
              <Sparkles className="mb-1 inline size-3.5 text-brand" /> Resumo:{' '}
              <span className="font-medium text-foreground">{proObj?.name}</span>
              {day !== null && ` · ${DAYS[day].label} ${DAYS[day].sub}`}{slot && ` às ${slot}`}
            </div>
          </div>
        </Section>
      )}

      {/* Navegação */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-0">
          <ArrowLeft className="size-4" /> Voltar
        </button>
        <button
          onClick={() => (step === 3 ? handleConfirm() : setStep((s) => s + 1))}
          disabled={!canNext || isPending}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-gradient px-6 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-40">
          {isPending ? (
            <><Loader2 className="size-4 animate-spin" /> Confirmando...</>
          ) : step === 3 ? (
            <>Confirmar agendamento <ArrowRight className="size-4" /></>
          ) : (
            <>Continuar <ArrowRight className="size-4" /></>
          )}
        </button>
      </div>
    </Shell>
  )
}

function Shell({ workspaceName, children }: { workspaceName?: string; children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center bg-secondary/40 px-4 py-10">
      <div className="mb-6"><Logo /></div>
      {workspaceName && (
        <p className="-mt-4 mb-4 text-sm font-medium text-muted-foreground">{workspaceName}</p>
      )}
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
        {children}
      </div>
      <div className="mt-8"><GrpCredit /></div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="animate-rise">
      <h1 className="mb-4 font-heading text-lg font-semibold tracking-tight text-foreground">{title}</h1>
      {children}
    </div>
  )
}
