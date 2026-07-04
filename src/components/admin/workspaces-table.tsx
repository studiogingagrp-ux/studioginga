'use client'

import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatCurrency } from '@/lib/utils'
import { DEMO_CLINICS, type DemoWorkspace } from '@/lib/demo/admin'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet'

const planTone: Record<string, string> = {
  Premium:      'bg-accent text-accent-foreground',
  Membro: 'bg-sky-50 text-sky-700',
  Essencial:    'bg-emerald-50 text-emerald-700',
  Trial:        'bg-amber-50 text-amber-700',
}

type WorkspacePlan = DemoWorkspace['plan']
const PLANS: WorkspacePlan[] = ['Essencial', 'Membro', 'Premium', 'Trial']
const BLANK: { name: string; city: string; slug: string; plan: WorkspacePlan; color: string } = {
  name: '', city: '', slug: '', plan: 'Essencial', color: '#b08d4e',
}

export function WorkspacesTable() {
  const [workspaces, setWorkspaces] = useState<DemoWorkspace[]>(DEMO_CLINICS)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<typeof BLANK>({ ...BLANK })

  const filtered = workspaces.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  )

  function toggle(id: string) {
    setWorkspaces((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        const status = c.status === 'Ativa' ? 'Suspensa' : 'Ativa'
        toast[status === 'Ativa' ? 'success' : 'message'](
          `${c.name} ${status === 'Ativa' ? 'reativada' : 'suspensa'}`,
        )
        return { ...c, status }
      }),
    )
  }

  function handleCreate() {
    if (!form.name.trim()) return
    const newWorkspace: DemoWorkspace = {
      id: Date.now().toString(),
      name: form.name,
      city: form.city || 'Brasil',
      plan: form.plan,
      users: 0,
      mrr: 0,
      status: 'Ativa' as const,
      color: form.color,
    }
    setWorkspaces((prev) => [...prev, newWorkspace])
    toast.success(`${form.name} cadastrada!`, { description: 'Empresa em modo Trial — configure o plano na sequência.' })
    setForm({ ...BLANK })
    setCreateOpen(false)
  }

  return (
    <>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Empresas</h1>
            <p className="mt-1 text-sm text-muted-foreground">{workspaces.length} empresas na plataforma</p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-95"
          >
            <Plus className="size-4" /> Nova empresa
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm shadow-soft">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar empresa…"
            className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Plano</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Usuários</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">MRR</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="size-8 shrink-0 rounded-lg" style={{ backgroundColor: c.color }} />
                      <div>
                        <p className="font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', planTone[c.plan])}>{c.plan}</span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{c.users}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{formatCurrency(c.mrr)}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-medium',
                      c.status === 'Ativa' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
                    )}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggle(c.id)}
                      className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary"
                    >
                      {c.status === 'Ativa' ? 'Suspender' : 'Reativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sheet: cadastro de nova empresa */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Nova empresa</SheetTitle>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nome da empresa *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Empresa Bella Vita"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-brand placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Cidade</label>
              <input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="Ex: São Paulo — SP"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-brand placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Slug (URL pública)</label>
              <input
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))
                }
                placeholder="ex: bella-vita"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-sm text-foreground outline-none focus:ring-1 focus:ring-brand placeholder:text-muted-foreground"
              />
              {form.slug && (
                <p className="text-[11px] text-muted-foreground">/agendar/{form.slug}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Plano inicial</label>
              <select
                value={form.plan}
                onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value as WorkspacePlan }))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-brand"
              >
                {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Cor da marca (white-label)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="size-10 cursor-pointer rounded-lg border border-border bg-background p-0.5"
                />
                <span className="font-mono text-sm text-muted-foreground">{form.color}</span>
                <span className="size-8 rounded-lg border border-border" style={{ backgroundColor: form.color }} />
              </div>
            </div>
          </div>

          <SheetFooter className="border-t border-border">
            <button
              onClick={() => setCreateOpen(false)}
              className="flex-1 rounded-xl border border-border py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={!form.name.trim()}
              className="flex-1 rounded-xl bg-brand-gradient py-2 text-sm font-semibold text-brand-foreground shadow-soft transition-transform hover:scale-[1.02] active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            >
              Cadastrar empresa
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
