'use client'

import { useState, useTransition } from 'react'
import { Plus, Briefcase, MessageCircle, Loader2, Info } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'
import { toggleMember, updateMemberColor } from '@/lib/actions/members'
import type { ProManager } from '@/lib/supabase/queries'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'

interface Pro {
  id: string; name: string; jobTitle: string; whatsapp: string; color: string; initials: string; active: boolean
}

const INITIAL_DEMO: Pro[] = [
  { id: 'm1', name: 'Estevam',         jobTitle: 'Dono · Direção', whatsapp: '5215500001111', color: '#f59e0b', initials: 'ES', active: true },
  { id: 'm2', name: 'Larissa Campos',  jobTitle: 'Social Media',   whatsapp: '5215500002222', color: '#3b82f6', initials: 'LC', active: true },
  { id: 'm3', name: 'Diego Fernandes', jobTitle: 'Tráfego Pago',   whatsapp: '5215500003333', color: '#10b981', initials: 'DF', active: true },
  { id: 'm4', name: 'Paula Mendes',    jobTitle: 'Audiovisual',    whatsapp: '5215500004444', color: '#a855f7', initials: 'PM', active: true },
]

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#a855f7', '#ef4444', '#4f46e5']
const inputCls = 'h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-brand/30'

interface Props {
  initialMembers?: ProManager[] | null
  isRealData?: boolean
}

export function MembersManager({ initialMembers, isRealData }: Props) {
  const [pros, setPros] = useState<Pro[]>(
    initialMembers ?? INITIAL_DEMO
  )
  const [open, setOpen]       = useState(false)
  const [form, setForm]       = useState({ name: '', jobTitle: '', whatsapp: '', color: COLORS[0] })
  const [isPending, start]    = useTransition()
  const [togglingId, setTogglingId] = useState<string | null>(null)

  async function handleToggle(id: string, current: boolean) {
    if (!isRealData) {
      setPros((p) => p.map((x) => (x.id === id ? { ...x, active: !x.active } : x)))
      return
    }
    setTogglingId(id)
    start(async () => {
      const res = await toggleMember(id, !current)
      if (res.error) {
        toast.error(res.error)
      } else {
        setPros((p) => p.map((x) => (x.id === id ? { ...x, active: !x.active } : x)))
        toast.success(!current ? 'Membro ativado' : 'Membro desativado')
      }
      setTogglingId(null)
    })
  }

  async function handleColorChange(id: string, color: string) {
    setPros((p) => p.map((x) => (x.id === id ? { ...x, color } : x)))
    if (!isRealData) return
    start(async () => {
      const res = await updateMemberColor(id, color)
      if (res.error) toast.error(res.error)
    })
  }

  function saveDemo() {
    if (!form.name.trim() || !form.jobTitle.trim()) { toast.error('Informe nome e função'); return }
    const parts    = form.name.trim().split(' ')
    const initials = parts.slice(0, 2).map((n) => n[0] ?? '').join('').toUpperCase()
    setPros((p) => [...p, { id: crypto.randomUUID(), ...form, initials, active: true }])
    toast.success(`${form.name} adicionado(a)!`)
    setForm({ name: '', jobTitle: '', whatsapp: '', color: COLORS[0] })
    setOpen(false)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Equipe"
        subtitle={`${pros.filter((p) => p.active).length} membros ativos${!isRealData ? ' (demo)' : ''}`}
        action={
          !isRealData ? (
            <button
              onClick={() => setOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-95"
            >
              <Plus className="size-4" /> Novo membro
            </button>
          ) : null
        }
      />

      {isRealData && pros.length === 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-dashed border-border bg-card/60 p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-5 shrink-0 text-brand" />
          <div>
            <p className="font-medium text-foreground">Nenhum membro cadastrado</p>
            <p className="mt-0.5 text-xs">
              Vá em <strong>Usuários</strong>, crie um usuário com perfil <em>Membro</em> e ele aparecerá aqui automaticamente.
            </p>
          </div>
        </div>
      )}

      {isRealData && pros.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-dashed border-border bg-card/60 px-4 py-3 text-xs text-muted-foreground">
          <Info className="size-4 shrink-0 text-brand" />
          Para adicionar equipe, crie usuários com perfil <em>Membro</em> em <strong>Usuários</strong>.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pros.map((p) => (
          <div
            key={p.id}
            className={cn('rounded-2xl border border-border bg-card p-5 shadow-soft transition-opacity', !p.active && 'opacity-50')}
          >
            <div className="flex items-center gap-3">
              <span
                className="grid size-12 place-items-center rounded-xl text-base font-semibold text-white"
                style={{ backgroundColor: p.color }}
              >
                {p.initials}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{p.name}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Briefcase className="size-3" />{p.jobTitle}
                </p>
              </div>
            </div>

            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <MessageCircle className="size-3.5 text-brand" />{p.whatsapp}
            </p>

            {/* Cor na agenda */}
            <div className="mt-3 flex items-center gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => handleColorChange(p.id, c)}
                  title={c}
                  className={cn(
                    'size-5 rounded-full transition-transform hover:scale-110',
                    p.color === c && 'scale-110 ring-2 ring-offset-1 ring-brand',
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <button
              onClick={() => handleToggle(p.id, p.active)}
              disabled={togglingId === p.id}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-50"
            >
              {togglingId === p.id
                ? <Loader2 className="size-3.5 animate-spin" />
                : p.active ? 'Desativar' : 'Ativar'
              }
            </button>
          </div>
        ))}
      </div>

      {/* Sheet — apenas modo demo */}
      {!isRealData && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader className="border-b border-border">
              <SheetTitle>Novo membro</SheetTitle>
              <SheetDescription>Cada membro tem sua cor na agenda e pode falar com o robô Atlas pelo WhatsApp.</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 px-4">
              <Field label="Nome">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Ana Ruiz" className={inputCls} />
              </Field>
              <Field label="Função">
                <input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} placeholder="Ex: Design" className={inputCls} />
              </Field>
              <Field label="WhatsApp (com DDI)">
                <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} inputMode="tel" placeholder="+52 1 55 9999-9999" className={inputCls} />
              </Field>
              <Field label="Cor na agenda">
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })}
                      className={cn('size-8 rounded-full transition-transform', form.color === c ? 'scale-110 ring-2 ring-offset-2 ring-brand' : '')}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </Field>
            </div>
            <SheetFooter>
              <button
                onClick={saveDemo}
                disabled={isPending}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60"
              >
                <Plus className="size-4" /> Adicionar
              </button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}
