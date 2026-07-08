'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Phone, MessageCircle, Clock, Briefcase, Building2, User, Trash2, Video } from 'lucide-react'
import { cn, formatPhone, getInitials } from '@/lib/utils'
import { toast } from 'sonner'
import { STATUS_META, STATUS_ORDER, TYPE_META } from '@/lib/constants/events'
import type { EventStatus } from '@/types/database'
import type { DemoEvent, DemoMember } from '@/lib/demo/data'
import { endTime } from '@/lib/agenda/time'
import { deleteEvent } from '@/lib/actions/events'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'

export function EventDetails({
  appt, pro, onClose, onStatusChange, onDelete, isRealData,
}: {
  appt: DemoEvent | null
  pro?: DemoMember
  onClose: () => void
  onStatusChange: (id: string, status: EventStatus) => void
  onDelete?: (id: string) => void
  isRealData?: boolean
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [, startTransition] = useTransition()
  function handleDelete() {
    if (!appt) return
    if (!confirmDelete) { setConfirmDelete(true); return }
    if (onDelete) onDelete(appt.id)
    if (isRealData) {
      startTransition(() =>
        deleteEvent(appt.id).then((r) => {
          if ('error' in r && r.error) toast.error(r.error)
          else toast.success('Agendamento excluído')
        })
      )
    }
    onClose()
    setConfirmDelete(false)
  }

  return (
    <Sheet open={!!appt} onOpenChange={(o) => { if (!o) { setConfirmDelete(false); onClose() } }}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        {appt && (
          <>
            <SheetHeader className="border-b border-border">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground">
                  {getInitials(appt.title)}
                </span>
                <div>
                  <SheetTitle>{appt.title}</SheetTitle>
                  <SheetDescription>
                    {appt.start}–{endTime(appt.start, appt.durationMin)} · {appt.durationMin} min
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="space-y-4 px-4">
              {appt.meetLink && (
                <a
                  href={appt.meetLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 transition-all hover:-translate-y-0.5 hover:shadow-card"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-500 text-black">
                    <Video className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">Entrar no Google Meet</span>
                    <span className="block truncate text-xs text-muted-foreground">{appt.meetLink.replace(/^https?:\/\//, '')}</span>
                  </span>
                </a>
              )}
              {(appt.type === 'reuniao' || appt.type === 'call') && (
                <Link
                  href={`/reuniao/${appt.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-brand/30 bg-accent/40 p-4 transition-all hover:-translate-y-0.5 hover:shadow-card"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-brand-foreground">
                    <Video className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-foreground">Abrir Sala da Reunião</span>
                    <span className="block text-xs text-muted-foreground">Pauta interativa, notas, próximos passos e follow-up</span>
                  </span>
                </Link>
              )}
              <Info icon={Briefcase} label="Membro" value={pro?.name ?? '—'} />
              {appt.phone && <Info icon={Phone} label="WhatsApp" value={formatPhone(appt.phone)} />}
              {appt.company && <Info icon={Building2} label="Empresa" value={appt.company} />}
              <Info icon={Clock} label="Tipo" value={`${TYPE_META[appt.type].emoji} ${TYPE_META[appt.type].label}`} />
              {appt.notes && <Info icon={User} label="Observações" value={appt.notes} />}

              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Status</p>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_ORDER.map((s) => {
                    const meta = STATUS_META[s]
                    const active = appt.status === s
                    return (
                      <button
                        key={s}
                        onClick={() => onStatusChange(appt.id, s)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                          active ? 'border-brand bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:bg-secondary',
                        )}
                      >
                        <span className={cn('size-1.5 rounded-full', meta.dot)} />
                        {meta.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <SheetFooter>
              {appt.phone && (
                <a
                  href={`https://wa.me/${appt.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-white transition-transform hover:scale-[1.01] active:scale-95"
                >
                  <MessageCircle className="size-4" /> Enviar WhatsApp
                </a>
              )}
              <button
                onClick={handleDelete}
                className={cn(
                  'inline-flex h-10 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors',
                  confirmDelete
                    ? 'border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100'
                    : 'border-border text-muted-foreground hover:bg-secondary',
                )}
              >
                <Trash2 className="size-4" />
                {confirmDelete ? 'Confirmar exclusão' : 'Excluir'}
              </button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Info({
  icon: Icon, label, value, className,
}: {
  icon: typeof Phone; label: string; value: string; className?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn('text-sm font-medium text-foreground', className)}>{value}</p>
      </div>
    </div>
  )
}
