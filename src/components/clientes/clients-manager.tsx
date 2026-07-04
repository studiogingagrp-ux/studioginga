'use client'

import { useState, useTransition } from 'react'
import { Search, Plus, MessageCircle, Zap, Loader2, Edit2, Trash2, CalendarPlus, Phone, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatPhone, getInitials } from '@/lib/utils'
import type { DemoClient } from '@/lib/demo/clients'
import { PageHeader } from '@/components/layout/page-header'
import { createClientRecord, updateClientRecord, deleteClientRecord } from '@/lib/actions/clients'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'

const empty = { name: '', phone: '', company: '', email: '', notes: '' }
const inputCls = 'h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-brand/30'

interface Props {
  initialClients: DemoClient[]
  isRealData?: boolean
}

export function ClientsManager({ initialClients, isRealData = false }: Props) {
  const [clients, setClients]        = useState<DemoClient[]>(initialClients)
  const [search, setSearch]          = useState('')
  const [open, setOpen]              = useState(false)
  const [detailOpen, setDetailOpen]  = useState(false)
  const [selected, setSelected]      = useState<DemoClient | null>(null)
  const [editForm, setEditForm]      = useState(empty)
  const [form, setForm]              = useState(empty)
  const [isPending, startTransition] = useTransition()
  const [isSavingEdit, startEdit]    = useTransition()
  const [isDeleting, startDelete]    = useTransition()

  function openDetail(p: DemoClient) {
    setSelected(p)
    setEditForm({
      name:    p.name,
      phone:   formatPhone(p.phone),
      company: p.company === '—' ? '' : p.company,
      email:   p.email ?? '',
      notes:   p.notes ?? '',
    })
    setDetailOpen(true)
  }

  function applyEdit(prev: DemoClient[]): DemoClient[] {
    if (!selected) return prev
    return prev.map((x) => x.id === selected.id
      ? {
          ...x,
          name:    editForm.name.trim(),
          phone:   editForm.phone.replace(/\D/g, ''),
          company: editForm.company.trim() || '—',
          email:   editForm.email.trim() || undefined,
          notes:   editForm.notes.trim() || undefined,
        }
      : x)
  }

  function handleSaveEdit() {
    if (!selected) return
    if (!editForm.name.trim() || !editForm.phone.trim()) { toast.error('Nome e WhatsApp obrigatórios'); return }

    if (!isRealData) {
      setClients(applyEdit)
      toast.success('Cliente atualizado')
      setDetailOpen(false)
      return
    }

    startEdit(async () => {
      const res = await updateClientRecord(selected.id, {
        name:    editForm.name,
        phone:   editForm.phone,
        company: editForm.company,
        email:   editForm.email,
        notes:   editForm.notes,
      })
      if (res.error) { toast.error(res.error); return }
      setClients(applyEdit)
      toast.success('Cliente atualizado')
      setDetailOpen(false)
    })
  }

  function handleDelete() {
    if (!selected) return
    if (!isRealData) {
      setClients((prev) => prev.filter((x) => x.id !== selected.id))
      toast.success('Cliente removido')
      setDetailOpen(false)
      return
    }
    startDelete(async () => {
      const res = await deleteClientRecord(selected.id)
      if (res.error) { toast.error(res.error); return }
      setClients((prev) => prev.filter((x) => x.id !== selected.id))
      toast.success('Cliente removido')
      setDetailOpen(false)
    })
  }

  const filtered = clients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.company.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search),
  )

  function save() {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Informe nome e WhatsApp')
      return
    }

    if (!isRealData) {
      const novo: DemoClient = {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        phone: form.phone.replace(/\D/g, ''),
        company: form.company.trim() || '—',
        email: form.email.trim() || undefined,
        lastVisit: '—',
        notes: form.notes || undefined,
      }
      setClients((prev) => [novo, ...prev])
      toast.success(`${novo.name} cadastrado!`)
      setForm(empty)
      setOpen(false)
      return
    }

    startTransition(async () => {
      const result = await createClientRecord({
        name:    form.name,
        phone:   form.phone,
        company: form.company || undefined,
        email:   form.email || undefined,
        notes:   form.notes || undefined,
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      if (result.client) {
        setClients((prev) => [result.client!, ...prev])
        toast.success(`${result.client.name} cadastrado!`)
        setForm(empty)
        setOpen(false)
      }
    })
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Clientes"
        subtitle={`${clients.length} clientes cadastrados${!isRealData ? ' (demo)' : ''}`}
        action={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-95"
          >
            <Plus className="size-4" /> Novo cliente
          </button>
        }
      />

      <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm shadow-soft">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, empresa ou telefone…"
          className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">WhatsApp</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Empresa</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Último contato</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                onClick={() => openDetail(p)}
                className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/40"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-gradient text-xs font-semibold text-brand-foreground">
                      {getInitials(p.name)}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground sm:hidden">{formatPhone(p.phone)}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{formatPhone(p.phone)}</td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{p.company}</span>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{p.lastVisit}</td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={`https://wa.me/${p.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-grid size-8 place-items-center rounded-lg text-emerald-600 transition-colors hover:bg-emerald-50"
                    title="WhatsApp"
                  >
                    <MessageCircle className="size-4" />
                  </a>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sheet de detalhe/edição */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          {selected && (
            <>
              <SheetHeader className="border-b border-border">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-gradient text-sm font-semibold text-brand-foreground">
                    {getInitials(selected.name)}
                  </span>
                  <div>
                    <SheetTitle className="text-left">{selected.name}</SheetTitle>
                    <SheetDescription className="text-left flex items-center gap-1">
                      <Phone className="size-3" /> {formatPhone(selected.phone)}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-4 px-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-secondary/50 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Empresa</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <Building2 className="size-3.5 text-muted-foreground" /> {selected.company}
                    </p>
                  </div>
                  <div className="rounded-xl bg-secondary/50 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Último contato</p>
                    <p className="mt-0.5 text-sm font-medium text-foreground">{selected.lastVisit}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Editar dados</p>
                  <div className="space-y-3">
                    <Field label="Nome completo">
                      <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="WhatsApp (com DDI)">
                      <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} inputMode="tel" className={inputCls} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Empresa">
                        <input value={editForm.company} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} placeholder="Ex: Café Central" className={inputCls} />
                      </Field>
                      <Field label="E-mail">
                        <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="nome@empresa.mx" className={inputCls} />
                      </Field>
                    </div>
                    <Field label="Observações">
                      <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={2}
                        className="w-full resize-none rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30" />
                    </Field>
                  </div>
                </div>
              </div>

              <SheetFooter className="flex-col gap-2">
                <div className="flex gap-2 w-full">
                  <a
                    href={`https://wa.me/${selected.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 h-10 items-center justify-center gap-1.5 rounded-xl border border-border text-sm text-emerald-700 transition-colors hover:bg-emerald-50"
                  >
                    <MessageCircle className="size-4" /> WhatsApp
                  </a>
                  <a
                    href="/agenda"
                    className="inline-flex flex-1 h-10 items-center justify-center gap-1.5 rounded-xl border border-border text-sm text-muted-foreground transition-colors hover:bg-secondary"
                  >
                    <CalendarPlus className="size-4" /> Agendar
                  </a>
                </div>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="inline-flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60"
                >
                  {isSavingEdit ? <Loader2 className="size-4 animate-spin" /> : <Edit2 className="size-4" />}
                  Salvar alterações
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex w-full h-9 items-center justify-center gap-1.5 rounded-xl text-xs text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                  Remover cliente
                </button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Sheet de cadastro rápido */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-brand" />
              <SheetTitle>Cadastro rápido</SheetTitle>
            </div>
            <SheetDescription>Só nome e WhatsApp são obrigatórios. O resto é opcional.</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4">
            <Field label="Nome completo" required>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
                placeholder="Ex: Camila Torres"
                className={inputCls}
              />
            </Field>
            <Field label="WhatsApp (com DDI)" required>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                inputMode="tel"
                placeholder="+52 1 55 9999-9999"
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Empresa">
                <input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Ex: Café Central"
                  className={inputCls}
                />
              </Field>
              <Field label="E-mail">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="nome@empresa.mx"
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Observações">
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="Contrato, preferências, anotações…"
                className="w-full resize-none rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30"
              />
            </Field>
          </div>

          <SheetFooter>
            <button
              onClick={save}
              disabled={isPending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60 disabled:scale-100"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Cadastrar cliente
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label} {required && <span className="text-brand">*</span>}
      </span>
      {children}
    </label>
  )
}
