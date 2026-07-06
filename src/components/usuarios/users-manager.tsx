'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, ShieldCheck, Loader2, Plus, Copy, Check, KeyRound, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { cn, getInitials } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'
import { ROLES, type Role } from '@/lib/constants/roles'
import type { TeamMember } from '@/lib/supabase/queries'
import { createEmployee, toggleEmployee } from '@/lib/actions/team'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'

interface Member { id: string; name: string; email: string; role: Role; active: boolean }

const INITIAL_DEMO: Member[] = [
  { id: 'u1', name: 'Estevam',         email: 'estevam@gingastudio.net', role: 'dono',      active: true },
  { id: 'u2', name: 'Regina Salas',    email: 'regina@gingastudio.net',  role: 'membro',    active: true },
  { id: 'u3', name: 'Mateo Cordero',   email: 'mateo@gingastudio.net',   role: 'membro',    active: true },
  { id: 'u4', name: 'Camila Ortiz',    email: 'camila@gingastudio.net',  role: 'convidado', active: false },
]

const ASSIGNABLE: Role[] = ['dono', 'membro', 'convidado']
const inputCls = 'h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-brand/30'

const ROLE_TONE: Record<Role, string> = {
  dono:        'bg-brand/10 text-brand',
  membro:      'bg-sky-500/15 text-sky-300',
  convidado:   'bg-secondary text-muted-foreground',
  super_admin: 'bg-purple-500/15 text-purple-300',
}

const ROLE_HINT: Record<string, string> = {
  dono:      'Dono / Sócio — acesso total: gerencia equipe, clientes e toda a operação.',
  membro:    'Colaborador — Meu Dia, tarefas, agenda e aprovações.',
  convidado: 'Convidado — acesso limitado, só o essencial.',
}

interface Props {
  initialMembers?: TeamMember[] | null
  isRealData?: boolean
}

export function UsersManager({ initialMembers, isRealData }: Props) {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>(initialMembers ?? INITIAL_DEMO)
  const [open, setOpen]       = useState(false)
  const [form, setForm]       = useState<{ name: string; email: string; role: Role }>({ name: '', email: '', role: 'membro' })
  const [pending, start]      = useTransition()
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied]   = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  function addEmployee() {
    if (!form.name.trim() || !form.email.trim()) { toast.error('Informe nome e e-mail'); return }

    if (!isRealData) {
      setMembers((m) => [...m, { id: crypto.randomUUID(), name: form.name, email: form.email, role: form.role, active: true }])
      toast.success(`${form.name} adicionado(a)!`)
      setForm({ name: '', email: '', role: 'membro' }); setOpen(false)
      return
    }

    start(async () => {
      const res = await createEmployee(form)
      if (res.error) { toast.error(res.error); return }
      setCreated({ email: form.email, password: res.tempPassword! })
      setMembers((m) => [...m, { id: crypto.randomUUID(), name: form.name, email: form.email, role: form.role, active: true }])
      toast.success(`${form.name} adicionado(a)! 🎉`)
      setForm({ name: '', email: '', role: 'membro' })
      router.refresh()
    })
  }

  function onToggle(id: string, active: boolean) {
    setMembers((m) => m.map((x) => x.id === id ? { ...x, active: !active } : x))
    if (!isRealData) return
    setTogglingId(id)
    start(async () => {
      const res = await toggleEmployee(id, !active)
      if (res.error) {
        toast.error(res.error)
        setMembers((m) => m.map((x) => x.id === id ? { ...x, active } : x)) // reverte
      }
      setTogglingId(null)
    })
  }

  function copySenha() {
    if (!created) return
    navigator.clipboard.writeText(`Acesso Ginga Studio\nLogin: ${created.email}\nSenha temporária: ${created.password}`)
    setCopied(true); setTimeout(() => setCopied(false), 1800)
    toast.success('Acesso copiado — mande pro colaborador!')
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Usuários e Permissões"
        subtitle={`${members.filter((m) => m.active).length} pessoas ativas${!isRealData ? ' (demo)' : ''}`}
        action={
          <button
            onClick={() => { setCreated(null); setOpen(true) }}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.02] active:scale-95"
          >
            <UserPlus className="size-4" /> Adicionar
          </button>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        {members.map((m, i) => (
          <div
            key={m.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3',
              i < members.length - 1 && 'border-b border-border/60',
              !m.active && 'opacity-50',
            )}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-gradient text-xs font-semibold text-brand-foreground">
              {getInitials(m.name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
                {m.role === 'dono' && <ShieldCheck className="size-3.5 shrink-0 text-brand" />}
              </div>
              <p className="truncate text-xs text-muted-foreground">{m.email}</p>
            </div>
            <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', ROLE_TONE[m.role] ?? 'bg-secondary text-muted-foreground')}>
              {ROLES[m.role]?.label ?? m.role}
            </span>
            {m.role !== 'dono' && (
              <button
                onClick={() => onToggle(m.id, m.active)}
                disabled={togglingId === m.id}
                className="hidden rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors sm:inline disabled:opacity-50 bg-secondary text-muted-foreground hover:text-foreground"
              >
                {togglingId === m.id ? <Loader2 className="size-3 animate-spin" /> : m.active ? 'Desativar' : 'Ativar'}
              </button>
            )}
          </div>
        ))}
        {members.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma pessoa ainda. Clique em <strong>Adicionar</strong>.
          </div>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Adicionar à equipe</SheetTitle>
            <SheetDescription>
              {isRealData
                ? 'A conta é criada na hora. Você recebe uma senha temporária para repassar.'
                : 'Modo demo — a pessoa entra na lista (sem conta real).'}
            </SheetDescription>
          </SheetHeader>

          {created ? (
            <div className="space-y-4 px-4">
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-300"><Check className="size-4" /> Conta criada!</p>
                <p className="mt-1 text-xs text-muted-foreground">Envie estes dados para a pessoa fazer o primeiro acesso:</p>
                <div className="mt-3 space-y-2 rounded-xl border border-border bg-background/60 p-3 font-mono text-xs">
                  <p className="flex items-center gap-2 text-foreground"><Mail className="size-3.5 text-muted-foreground" /> {created.email}</p>
                  <p className="flex items-center gap-2 text-foreground"><KeyRound className="size-3.5 text-muted-foreground" /> {created.password}</p>
                </div>
                <button onClick={copySenha} className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-brand-gradient text-xs font-semibold text-brand-foreground shadow-gold">
                  {copied ? <><Check className="size-3.5" /> Copiado!</> : <><Copy className="size-3.5" /> Copiar acesso</>}
                </button>
              </div>
              <button onClick={() => setCreated(null)} className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary">
                <Plus className="size-4" /> Adicionar outra pessoa
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4 px-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Nome</span>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nome completo" className={inputCls} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">E-mail</span>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    type="email" placeholder="email@gingastudio.net" className={inputCls} />
                </label>
                <div>
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Permissão</span>
                  <div className="grid grid-cols-3 gap-2">
                    {ASSIGNABLE.map((r) => (
                      <button key={r} onClick={() => setForm({ ...form, role: r })}
                        className={cn(
                          'rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
                          form.role === r
                            ? 'border-brand bg-brand/10 text-brand'
                            : 'border-border text-muted-foreground hover:bg-secondary',
                        )}>
                        {ROLES[r].label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{ROLE_HINT[form.role]}</p>
                </div>
              </div>
              <SheetFooter>
                <button
                  onClick={addEmployee}
                  disabled={pending}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60"
                >
                  {pending ? <Loader2 className="size-4 animate-spin" /> : <><UserPlus className="size-4" /> Criar acesso</>}
                </button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
