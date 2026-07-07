'use client'

import { useState, useTransition } from 'react'
import { Clock, Plus, Trash2, Loader2, FolderKanban, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  GINGA_PROJECTS, PROJECT_STATUS_META, PROJECT_STATUS_ORDER, PRIORITY_META, clientOf,
} from '@/lib/demo/agency'
import { createProject, updateProject, removeProject } from '@/lib/actions/projects'
import type { ProjectStatus, Priority } from '@/types/database'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'

export interface ProjectRow {
  id: string; name: string; clientId: string | null; clientName: string
  description: string; deadline: string | null; status: ProjectStatus; priority: Priority; progress: number
}
export interface ClientOpt { id: string; name: string }

const PRIORITIES: Priority[] = ['baixa', 'media', 'alta', 'urgente']

const DEMO_ROWS: ProjectRow[] = GINGA_PROJECTS.map((p) => ({
  id: p.id, name: p.name, clientId: p.clientId, clientName: clientOf(p.clientId)?.name ?? '—',
  description: p.description, deadline: p.deadline, status: p.status, priority: p.priority, progress: p.progress,
}))
const DEMO_CLIENTS: ClientOpt[] = [...new Map(GINGA_PROJECTS.map((p) => [p.clientId, { id: p.clientId, name: clientOf(p.clientId)?.name ?? '—' }])).values()]

const empty = { name: '', clientId: '', description: '', deadline: '', status: 'planejamento' as ProjectStatus, priority: 'media' as Priority, progress: 0 }

export function ProjetosView({ initialProjects, clients, isRealData }: { initialProjects: ProjectRow[] | null; clients: ClientOpt[]; isRealData?: boolean }) {
  const [rows, setRows] = useState<ProjectRow[]>(initialProjects ?? DEMO_ROWS)
  const clientOpts = isRealData ? clients : DEMO_CLIENTS
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<typeof empty>(empty)
  const [pending, start] = useTransition()

  const ativos = rows.filter((p) => !['finalizado', 'pausado'].includes(p.status))

  function openNew() { setEditing(null); setForm(empty); setOpen(true) }
  function openEdit(p: ProjectRow) {
    setEditing(p.id)
    setForm({ name: p.name, clientId: p.clientId ?? '', description: p.description, deadline: p.deadline ?? '', status: p.status, priority: p.priority, progress: p.progress })
    setOpen(true)
  }

  function save() {
    if (!form.name.trim()) { toast.error('Informe o nome do projeto'); return }
    const clientName = clientOpts.find((c) => c.id === form.clientId)?.name ?? '—'
    const payload = { name: form.name, clientId: form.clientId || null, description: form.description, deadline: form.deadline || null, status: form.status, priority: form.priority, progress: Number(form.progress) || 0 }

    const applyLocal = (id: string) => {
      const row: ProjectRow = { id, ...payload, clientName }
      setRows((rs) => editing ? rs.map((r) => r.id === editing ? row : r) : [row, ...rs])
    }

    if (!isRealData) { applyLocal(editing ?? crypto.randomUUID()); toast.success(editing ? 'Projeto atualizado!' : 'Projeto criado!'); setOpen(false); return }

    start(async () => {
      const res = editing ? await updateProject(editing, payload) : await createProject(payload)
      if (res.error) { toast.error(res.error); return }
      applyLocal(editing ?? (res as unknown as { id?: string }).id ?? crypto.randomUUID())
      toast.success(editing ? 'Projeto atualizado! 💾' : 'Projeto criado! 🎉')
      setOpen(false)
    })
  }

  function remove(id: string) {
    setRows((rs) => rs.filter((r) => r.id !== id))
    if (!isRealData) { toast.success('Projeto removido'); return }
    start(async () => { const res = await removeProject(id); if (res.error) toast.error(res.error) })
  }

  const ordered = [...rows].sort((a, b) => (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999'))

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-brand">Produção{!isRealData && ' · demo'}</p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-foreground">Projetos</h1>
          <p className="mt-1 text-sm text-muted-foreground">{ativos.length} projetos ativos · cliente, prazo, status e progresso.</p>
        </div>
        <button onClick={openNew} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.02] active:scale-95">
          <Plus className="size-4" /> Novo projeto
        </button>
      </header>

      {ordered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <FolderKanban className="mx-auto mb-3 size-8 text-brand" />
          <p className="font-display text-lg font-bold text-foreground">Nenhum projeto ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">Crie seu primeiro projeto pra acompanhar a produção.</p>
          <button onClick={openNew} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-foreground shadow-gold"><Plus className="size-4" /> Criar projeto</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((p) => {
            const meta = PROJECT_STATUS_META[p.status]
            const late = p.deadline && p.deadline < new Date().toISOString().split('T')[0] && !['finalizado', 'aprovado'].includes(p.status)
            return (
              <div key={p.id} className={cn('group animate-rise flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:border-brand/30', p.status === 'pausado' && 'opacity-70')}>
                <div className="flex items-start justify-between gap-2">
                  <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium', meta.chip)}>{meta.label}</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', PRIORITY_META[p.priority].chip)}>{PRIORITY_META[p.priority].label}</span>
                </div>
                <button onClick={() => openEdit(p)} className="mt-3 text-left">
                  <h3 className="font-display text-lg font-bold leading-tight text-foreground hover:text-brand">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{p.clientName}</p>
                  {p.description && <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground/80">{p.description}</p>}
                </button>

                <div className="mt-4 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-brand-gradient" style={{ width: `${p.progress}%` }} /></div>
                  <span className="font-mono text-[11px] text-muted-foreground tabular">{p.progress}%</span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className={cn('inline-flex items-center gap-1 text-[11px]', late ? 'text-rose-300' : 'text-muted-foreground')}>
                    <Clock className="size-3" />{p.deadline ? new Date(`${p.deadline}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'sem prazo'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(p)} className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" title="Editar"><Pencil className="size-3.5" /></button>
                    <button onClick={() => remove(p.id)} className="grid size-8 place-items-center rounded-lg text-muted-foreground/40 transition-colors hover:text-rose-300" title="Remover"><Trash2 className="size-3.5" /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Novo / editar projeto */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <SheetTitle>{editing ? 'Editar projeto' : 'Novo projeto'}</SheetTitle>
            <SheetDescription>Cliente, prazo, status e progresso.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Nome do projeto</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Rebranding completo" className={inp} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Cliente</span>
              <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className={inp}>
                <option value="">— sem cliente —</option>
                {clientOpts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Prazo</span>
                <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className={inp} /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Progresso: {form.progress}%</span>
                <input type="range" min={0} max={100} step={5} value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} className="mt-3 w-full accent-brand" /></label>
            </div>
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Status</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })} className={inp}>
                {PROJECT_STATUS_ORDER.map((s) => <option key={s} value={s}>{PROJECT_STATUS_META[s].label}</option>)}
              </select></label>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Prioridade</span>
              <div className="grid grid-cols-4 gap-2">
                {PRIORITIES.map((pr) => (
                  <button key={pr} onClick={() => setForm({ ...form, priority: pr })}
                    className={cn('rounded-lg border px-2 py-2 text-xs font-medium transition-colors', form.priority === pr ? 'border-brand bg-brand/10 text-brand' : 'border-border bg-card text-muted-foreground')}>
                    {PRIORITY_META[pr].label}
                  </button>
                ))}
              </div>
            </div>
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">Descrição (opcional)</span>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="O que é esse projeto…" className="w-full resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30" /></label>
            <button onClick={save} disabled={pending} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-foreground shadow-gold transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60">
              {pending ? <Loader2 className="size-4 animate-spin" /> : <>{editing ? 'Salvar' : 'Criar projeto'}</>}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

const inp = 'h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30'
