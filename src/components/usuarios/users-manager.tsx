'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, ShieldCheck, Loader2, Plus, Copy, Check, KeyRound, UserPlus, Trash2, SlidersHorizontal, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { cn, getInitials } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'
import { ROLES, type Role } from '@/lib/constants/roles'
import { FEATURES, defaultPermissions } from '@/lib/constants/features'
import type { TeamMember } from '@/lib/supabase/queries'
import { createEmployee, toggleEmployee, removeEmployee, setEmployeePermissions } from '@/lib/actions/team'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'

interface Member { id: string; name: string; email: string; role: Role; active: boolean; permissions?: Record<string, boolean> | null; protected?: boolean }

const INITIAL_DEMO: Member[] = [
  { id: 'u1', name: 'Estevam',         email: 'estevam@gingastudio.net', role: 'dono',      active: true, protected: true },
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
  membro:    'Colaborador — Meu Dia, tarefas, agenda e o que você liberar nas permissões.',
  convidado: 'Convidado — acesso limitado, só o que você liberar.',
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
  const [permFor, setPermFor] = useState<Member | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

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
      if (res.error) { toast.error(res.error); setMembers((m) => m.map((x) => x.id === id ? { ...x, active } : x)) }
      setTogglingId(null)
    })
  }

  function onRemove(m: Member) {
    if (m.protected) { toast.error('A conta do dono principal é protegida e não pode ser excluída.'); return }
    if (!confirm(`Excluir o acesso de ${m.name}? A conta some e a pessoa perde o login. Esta ação não volta.`)) return
    setRemovingId(m.id)
    const prev = members
    setMembers((list) => list.filter((x) => x.id !== m.id))
    if (!isRealData) { toast.success('Acesso excluído.'); setRemovingId(null); return }
    start(async () => {
      const res = await removeEmployee(m.id)
      if (res.error) { toast.error(res.error); setMembers(prev) }
      else toast.success(`Acesso de ${m.name} excluído.`)
      setRemovingId(null)
      router.refresh()
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
        title="Equipe & Acessos"
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
        {members.map((m, i) => {
          const canManage = m.role !== 'dono' && m.role !== 'super_admin'
          return (
            <div
              key={m.id}
              className={cn('flex items-center gap-3 px-4 py-3', i < members.length - 1 && 'border-b border-border/60', !m.active && 'opacity-50')}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-gradient text-xs font-semibold text-brand-foreground">
                {getInitials(m.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
                  {m.role === 'dono' && <ShieldCheck className="size-3.5 shrink-0 text-brand" />}
                  {m.protected && <Lock className="size-3 shrink-0 text-muted-foreground" />}
                </div>
                <p className="truncate text-xs text-muted-foreground">{m.email}</p>
              </div>
              <span className={cn('hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline', ROLE_TONE[m.role] ?? 'bg-secondary text-muted-foreground')}>
                {ROLES[m.role]?.label ?? m.role}
              </span>

              {canManage && (
                <button
                  onClick={() => setPermFor(m)}
                  title="Permissões / funções liberadas"
                  className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-secondary text-muted-foreground transition-colors hover:text-brand"
                >
                  <SlidersHorizontal className="size-4" />
                </button>
              )}
              {canManage && (
                <button
                  onClick={() => onToggle(m.id, m.active)}
                  disabled={togglingId === m.id}
                  className="hidden rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50 sm:inline"
                >
                  {togglingId === m.id ? <Loader2 className="size-3 animate-spin" /> : m.active ? 'Desativar' : 'Ativar'}
                </button>
              )}
              {m.protected ? (
                <span className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground/40" title="Conta protegida — não pode ser excluída">
                  <Lock className="size-4" />
                </span>
              ) : canManage ? (
                <button
                  onClick={() => onRemove(m)}
                  disabled={removingId === m.id}
                  title="Excluir acesso"
                  className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-secondary text-muted-foreground transition-colors hover:border-rose-500/30 hover:text-rose-300 disabled:opacity-50"
                >
                  {removingId === m.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                </button>
              ) : null}
            </div>
          )
        })}
        {members.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma pessoa ainda. Clique em <strong>Adicionar</strong>.
          </div>
        )}
      </div>

      <p className="mt-3 px-1 text-xs text-muted-foreground">
        <SlidersHorizontal className="mr-1 inline size-3.5" /> Use o botão de ajustes para <b className="text-foreground">liberar ou bloquear cada função</b> por colaborador. O dono tem acesso total.
      </p>

      {/* Adicionar pessoa */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Adicionar à equipe</SheetTitle>
            <SheetDescription>
              {isRealData ? 'A conta é criada na hora. Você recebe uma senha temporária para repassar.' : 'Modo demo — a pessoa entra na lista (sem conta real).'}
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
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" className={inputCls} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">E-mail</span>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" placeholder="email@gingastudio.net" className={inputCls} />
                </label>
                <div>
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Papel</span>
                  <div className="grid grid-cols-3 gap-2">
                    {ASSIGNABLE.map((r) => (
                      <button key={r} onClick={() => setForm({ ...form, role: r })}
                        className={cn('rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
                          form.role === r ? 'border-brand bg-brand/10 text-brand' : 'border-border text-muted-foreground hover:bg-secondary')}>
                        {ROLES[r].label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{ROLE_HINT[form.role]}</p>
                </div>
              </div>
              <SheetFooter>
                <button onClick={addEmployee} disabled={pending}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60">
                  {pending ? <Loader2 className="size-4 animate-spin" /> : <><UserPlus className="size-4" /> Criar acesso</>}
                </button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Editor de permissões */}
      <PermissionsSheet
        member={permFor}
        isRealData={isRealData}
        onClose={() => setPermFor(null)}
        onSaved={(id, perms) => setMembers((list) => list.map((x) => x.id === id ? { ...x, permissions: perms } : x))}
      />
    </div>
  )
}

function PermissionsSheet({ member, isRealData, onClose, onSaved }: {
  member: Member | null
  isRealData?: boolean
  onClose: () => void
  onSaved: (id: string, perms: Record<string, boolean>) => void
}) {
  const [perms, setPerms] = useState<Record<string, boolean>>({})
  const [saving, start] = useTransition()
  const [ready, setReady] = useState(false)

  // sincroniza o estado quando abre para um membro
  if (member && !ready) {
    setPerms({ ...defaultPermissions(), ...(member.permissions ?? {}) })
    setReady(true)
  }
  if (!member && ready) setReady(false)

  function toggle(key: string) { setPerms((p) => ({ ...p, [key]: !p[key] })) }
  function setAll(v: boolean) { setPerms(Object.fromEntries(FEATURES.map((f) => [f.key, v]))) }

  function salvar() {
    if (!member) return
    if (!isRealData) { onSaved(member.id, perms); toast.success('Permissões salvas!'); onClose(); return }
    start(async () => {
      const res = await setEmployeePermissions(member.id, perms)
      if (res.error) { toast.error(res.error); return }
      onSaved(member.id, perms)
      toast.success(`Permissões de ${member.name} atualizadas! 🔐`)
      onClose()
    })
  }

  return (
    <Sheet open={!!member} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Permissões · {member?.name}</SheetTitle>
          <SheetDescription>Ligue ou desligue cada função para este colaborador. Só aparece o que estiver ligado.</SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <div className="mb-3 flex items-center gap-2">
            <button onClick={() => setAll(true)} className="rounded-lg border border-border bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground">Liberar tudo</button>
            <button onClick={() => setAll(false)} className="rounded-lg border border-border bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground">Bloquear tudo</button>
          </div>
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {FEATURES.map((f) => {
              const on = perms[f.key] !== false
              return (
                <button key={f.key} onClick={() => toggle(f.key)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{f.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{f.hint}</p>
                  </div>
                  <span className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', on ? 'bg-brand' : 'bg-secondary')}>
                    <span className={cn('absolute top-0.5 size-5 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} />
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        <SheetFooter>
          <button onClick={salvar} disabled={saving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <><Check className="size-4" /> Salvar permissões</>}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
