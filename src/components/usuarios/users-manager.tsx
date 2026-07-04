'use client'

import { useState } from 'react'
import { Mail, Info, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { cn, getInitials } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'
import { ROLES, type Role } from '@/lib/constants/roles'
import type { TeamMember } from '@/lib/supabase/queries'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'

interface Member { id: string; name: string; email: string; role: Role; active: boolean }

const INITIAL_DEMO: Member[] = [
  { id: 'u1', name: 'Estevam',         email: 'estevam@atlasagenda.center', role: 'dono',      active: true },
  { id: 'u2', name: 'Larissa Campos',  email: 'larissa@atlasagenda.center', role: 'membro',    active: true },
  { id: 'u3', name: 'Diego Fernandes', email: 'diego@atlasagenda.center',   role: 'membro',    active: true },
  { id: 'u4', name: 'Paula Mendes',    email: 'paula@atlasagenda.center',   role: 'convidado', active: false },
]

const ASSIGNABLE: Role[] = ['dono', 'membro', 'convidado']
const inputCls = 'h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-brand/30'

const ROLE_TONE: Record<Role, string> = {
  dono:        'bg-brand/10 text-brand',
  membro:      'bg-sky-50 text-sky-700',
  convidado:   'bg-secondary text-muted-foreground',
  super_admin: 'bg-purple-50 text-purple-700',
}

interface Props {
  initialMembers?: TeamMember[] | null
  isRealData?: boolean
}

export function UsersManager({ initialMembers, isRealData }: Props) {
  const [members] = useState<Member[]>(initialMembers ?? INITIAL_DEMO)
  const [open, setOpen]   = useState(false)
  const [form, setForm]   = useState<{ name: string; email: string; role: Role }>({ name: '', email: '', role: 'membro' })

  function handleInvite() {
    if (!form.name.trim() || !form.email.trim()) { toast.error('Informe nome e e-mail'); return }
    toast.info('Convite copiado!', {
      description: `Crie o usuário "${form.email}" no Supabase → Authentication → Add user, depois atualize o perfil com workspace_id e role = '${form.role}'.`,
      duration: 8000,
    })
    setForm({ name: '', email: '', role: 'membro' })
    setOpen(false)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Usuários e Permissões"
        subtitle={`${members.filter((m) => m.active).length} membros ativos na equipe`}
        action={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-95"
          >
            <Mail className="size-4" /> Convidar
          </button>
        }
      />

      {isRealData && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-dashed border-border bg-card/60 p-4 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-brand" />
          <span>
            Dados reais do Supabase. Para adicionar usuários: <strong>Supabase → Authentication → Add user</strong>,
            depois atualize o profile com <code className="rounded bg-secondary px-1">workspace_id</code> e <code className="rounded bg-secondary px-1">role</code> via SQL Editor.
          </span>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
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
            <span className={cn(
              'hidden rounded-full px-2 py-0.5 text-[11px] font-medium sm:inline',
              m.active ? 'bg-emerald-50 text-emerald-700' : 'bg-secondary text-muted-foreground',
            )}>
              {m.active ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        ))}
        {members.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Nenhum usuário cadastrado. Adicione via Supabase Auth.
          </div>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Convidar para a equipe</SheetTitle>
            <SheetDescription>
              {isRealData
                ? 'Crie o usuário no Supabase Auth e configure o perfil com as instruções abaixo.'
                : 'A pessoa recebe um e-mail para criar a senha e acessar.'}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Nome</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome completo" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">E-mail</span>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                type="email" placeholder="email@workspacea.com.br" className={inputCls} />
            </label>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Perfil</span>
              <div className="grid grid-cols-3 gap-2">
                {ASSIGNABLE.map((r) => (
                  <button key={r} onClick={() => setForm({ ...form, role: r })}
                    className={cn(
                      'rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors',
                      form.role === r
                        ? 'border-brand bg-accent/60 text-accent-foreground'
                        : 'border-border text-muted-foreground hover:bg-secondary',
                    )}>
                    {ROLES[r].label}
                  </button>
                ))}
              </div>
            </div>

            {isRealData && (
              <div className="rounded-xl border border-dashed border-border bg-secondary/40 p-3 text-xs text-muted-foreground space-y-1.5">
                <p className="font-medium text-foreground">Como adicionar:</p>
                <p>1. Supabase → Authentication → Add user</p>
                <p>2. Email: <strong>{form.email || 'email@workspacea.com.br'}</strong></p>
                <p>3. Após criar, copie o UUID e rode no SQL Editor:</p>
                <code className="block mt-1 whitespace-pre-wrap rounded bg-background p-2 text-[10px]">
                  {`UPDATE profiles SET\n  workspace_id = get_workspace_id(),\n  role = '${form.role}',\n  full_name = '${form.name || 'Nome'}',\n  email = '${form.email || 'email@workspacea.com.br'}'\nWHERE id = '<UUID>';`}
                </code>
              </div>
            )}
          </div>
          <SheetFooter>
            <button
              onClick={handleInvite}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.01] active:scale-95"
            >
              <Mail className="size-4" />
              {isRealData ? 'Ver instruções' : 'Enviar convite'}
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
