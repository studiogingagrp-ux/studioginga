'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ExternalLink, MessageCircle, Plus, Pencil, Trash2, Loader2, Users, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { GINGA_CLIENTS, mx } from '@/lib/demo/agency'
import { EnviarPortal } from '@/components/clientes/enviar-portal'
import { createAgencyClient, updateAgencyClient, removeAgencyClient, type ClienteStatus } from '@/lib/actions/clients'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'

export interface ClienteRow {
  id: string; name: string; segment: string; contact: string
  phone: string; email: string; monthly: number; status: ClienteStatus
}

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const STATUS: Record<string, { label: string; chip: string; dot: string }> = {
  ativo:    { label: 'Ativo',    chip: 'bg-emerald-500/15 text-emerald-300', dot: 'bg-emerald-400' },
  pausado:  { label: 'Pausado',  chip: 'bg-zinc-500/15 text-zinc-400',       dot: 'bg-zinc-500' },
  prospect: { label: 'Prospect', chip: 'bg-sky-500/15 text-sky-300',         dot: 'bg-sky-400' },
}

const DEMO_ROWS: ClienteRow[] = GINGA_CLIENTS.map((c) => ({
  id: c.id, name: c.name, segment: c.segment, contact: c.contact,
  phone: c.phone, email: '', monthly: c.monthly, status: c.status as ClienteStatus,
}))

const empty = { name: '', segment: '', contact: '', phone: '', email: '', monthly: '', status: 'ativo' as ClienteStatus }

export function ClientesView({ initialClients, isRealData }: { initialClients: ClienteRow[] | null; isRealData?: boolean }) {
  const [clients, setClients] = useState<ClienteRow[]>(initialClients ?? DEMO_ROWS)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<typeof empty>(empty)
  const [pending, start] = useTransition()

  const ativos = clients.filter((c) => c.status === 'ativo')
  const mrr = ativos.reduce((s, c) => s + (Number(c.monthly) || 0), 0)

  function openNew() { setEditing(null); setForm(empty); setOpen(true) }
  function openEdit(c: ClienteRow) {
    setEditing(c.id)
    setForm({ name: c.name, segment: c.segment, contact: c.contact, phone: c.phone, email: c.email, monthly: String(c.monthly || ''), status: c.status })
    setOpen(true)
  }

  function save() {
    if (!form.name.trim()) { toast.error('Informe o nome do cliente'); return }
    const payload = { name: form.name, segment: form.segment, contact: form.contact, phone: form.phone, email: form.email, monthly: Number(form.monthly) || 0, status: form.status }

    if (!isRealData) {
      if (editing) setClients((cs) => cs.map((c) => c.id === editing ? { ...c, ...payload } : c))
      else setClients((cs) => [{ id: crypto.randomUUID(), ...payload }, ...cs])
      toast.success(editing ? 'Cliente atualizado!' : 'Cliente adicionado!')
      setOpen(false); return
    }

    start(async () => {
      const res = editing ? await updateAgencyClient(editing, payload) : await createAgencyClient(payload)
      if (res.error) { toast.error(res.error); return }
      const newId = (res as unknown as { id?: string }).id ?? crypto.randomUUID()
      if (editing) setClients((cs) => cs.map((c) => c.id === editing ? { ...c, ...payload } : c))
      else setClients((cs) => [{ id: newId, ...payload }, ...cs])
      toast.success(editing ? 'Cliente atualizado! 💾' : 'Cliente adicionado! 🎉')
      setOpen(false)
    })
  }

  function remove(id: string) {
    setClients((cs) => cs.filter((c) => c.id !== id))
    if (!isRealData) { toast.success('Cliente removido'); return }
    start(async () => {
      const res = await removeAgencyClient(id)
      if (res.error) toast.error(res.error)
    })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-brand">Carteira{!isRealData && ' · demo'}</p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">{ativos.length} ativos · {mx(mrr)}/mês em contratos · cada um tem seu portal.</p>
        </div>
        <button onClick={openNew} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.02] active:scale-95">
          <Plus className="size-4" /> Novo cliente
        </button>
      </header>

      {clients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Users className="mx-auto mb-3 size-8 text-brand" />
          <p className="font-display text-lg font-bold text-foreground">Nenhum cliente ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">Cadastre seu primeiro cliente pra começar.</p>
          <button onClick={openNew} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-gold">
            <Plus className="size-4" /> Adicionar cliente
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => {
            const st = STATUS[c.status] ?? STATUS.ativo
            const initials = c.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
            return (
              <div key={c.id} className={cn('animate-rise group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:border-brand/30', c.status === 'pausado' && 'opacity-75')}>
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-gradient font-display text-sm font-extrabold text-brand-foreground">{initials}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[15px] font-bold text-foreground">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.segment || '—'}</p>
                  </div>
                  <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', st.chip)}>
                    <span className={cn('size-1.5 rounded-full', st.dot)} /> {st.label}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 border-y border-border py-3 text-center">
                  <div><p className="font-display text-sm font-bold text-foreground tabular">{c.monthly ? mx(c.monthly).replace('MX$ ', '') : '—'}</p><p className="kicker text-muted-foreground/50">MX$/mês</p></div>
                  <div className="truncate"><p className="truncate font-display text-sm font-bold text-foreground">{c.contact || '—'}</p><p className="kicker text-muted-foreground/50">contato</p></div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {/* Em modo real o token do portal é o UUID do cliente (não-enumerável) */}
                  <EnviarPortal name={c.name} contact={c.contact || c.name} phone={c.phone} slug={isRealData ? c.id : slugify(c.name)} />
                  <Link href={`/portal/${isRealData ? c.id : slugify(c.name)}`} target="_blank" className="grid size-9 place-items-center rounded-xl border border-border bg-secondary text-foreground transition-colors hover:bg-white/10" title="Ver portal">
                    <ExternalLink className="size-4" />
                  </Link>
                  <button onClick={() => openEdit(c)} className="grid size-9 place-items-center rounded-xl border border-border bg-secondary text-foreground transition-colors hover:bg-white/10" title="Editar">
                    <Pencil className="size-4" />
                  </button>
                  <button onClick={() => remove(c.id)} className="grid size-9 place-items-center rounded-xl border border-border bg-secondary text-muted-foreground transition-colors hover:text-rose-300" title="Remover">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
        <ArrowUpRight className="size-3.5" /> {isRealData ? 'Seus clientes reais — salvos com segurança.' : 'Modo demonstração — conecte o login pra salvar de verdade.'}
      </p>

      {/* Novo / editar cliente */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <SheetTitle>{editing ? 'Editar cliente' : 'Novo cliente'}</SheetTitle>
            <SheetDescription>{editing ? 'Atualize os dados do cliente.' : 'Cadastre um cliente da agência.'}</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Nome / empresa</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Casa Lumen" className={inp} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Segmento</span>
                <input value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })} placeholder="Ex: Arquitetura" className={inp} /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Contato</span>
                <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Nome do contato" className={inp} /></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">WhatsApp</span>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+52…" className={inp} /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Mensalidade (MX$)</span>
                <input value={form.monthly} onChange={(e) => setForm({ ...form, monthly: e.target.value })} inputMode="decimal" placeholder="0" className={inp} /></label>
            </div>
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">E-mail (opcional)</span>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" placeholder="email@cliente.com" className={inp} /></label>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Status</span>
              <div className="grid grid-cols-3 gap-2">
                {(['ativo', 'pausado', 'prospect'] as ClienteStatus[]).map((s) => (
                  <button key={s} onClick={() => setForm({ ...form, status: s })}
                    className={cn('rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
                      form.status === s ? 'border-brand bg-brand/10 text-brand' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>
                    {STATUS[s].label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={save} disabled={pending} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60">
              {pending ? <Loader2 className="size-4 animate-spin" /> : <>{editing ? 'Salvar' : 'Adicionar'}</>}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

const inp = 'h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30'
