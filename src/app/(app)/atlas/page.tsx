import type { Metadata } from 'next'
import { AtlasClient, type AtlasSnapshot, type AtlasAlert } from '@/components/atlas/atlas-client'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { createClient } from '@/lib/supabase/server'
import { mx, GINGA_TEAM, GINGA_CLIENTS, GINGA_TASKS, GINGA_APPROVALS, GINGA_LEADS, isLate } from '@/lib/demo/agency'

export const metadata: Metadata = { title: 'Atlas' }
export const dynamic = 'force-dynamic'

const todayISO = () => new Date().toISOString().slice(0, 10)
const daysSince = (iso: string | null): number => {
  if (!iso) return 999
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) return 999
  return Math.max(0, Math.floor((Date.now() - ms) / 86400000))
}

function demoSnapshot(): AtlasSnapshot {
  const members = GINGA_TEAM.map((m) => ({ name: m.name, openTasks: GINGA_TASKS.filter((t) => t.memberId === m.id && t.status !== 'concluido').length }))
  const lateTasks = GINGA_TASKS.filter((t) => t.status !== 'concluido' && isLate(t.due)).map((t) => ({ title: t.title }))
  const pendingApprovals = GINGA_APPROVALS.filter((a) => ['enviado', 'reenviado', 'alteracao'].includes(a.status)).map((a) => ({ title: a.title }))
  const hotLeads = GINGA_LEADS.filter((l) => ['negociacao', 'proposta'].includes(l.stage)).sort((a, b) => b.value - a.value).slice(0, 3).map((l) => ({ company: l.company, value: l.value, stage: l.stage }))
  const staleClients = GINGA_CLIENTS.filter((c) => c.lastContactDays >= 14).sort((a, b) => b.lastContactDays - a.lastContactDays).slice(0, 3).map((c) => ({ name: c.name, days: c.lastContactDays }))
  const mrr = GINGA_CLIENTS.reduce((s, c) => s + (c.status === 'ativo' ? c.monthly : 0), 0)
  const alerts: AtlasAlert[] = []
  if (lateTasks.length) alerts.push({ id: 'a-late', severity: 'urgente', title: `${lateTasks.length} tarefa(s) atrasada(s)`, body: lateTasks.map((t) => t.title).join('; '), href: '/operacao' })
  if (pendingApprovals.length) alerts.push({ id: 'a-appr', severity: 'atencao', title: `${pendingApprovals.length} aprovações pendentes`, body: 'Aguardando o aval do cliente.', href: '/aprovacoes' })
  if (staleClients.length) alerts.push({ id: 'a-stale', severity: 'atencao', title: `${staleClients.length} cliente(s) parado(s)`, body: `${staleClients[0].name} há ${staleClients[0].days} dias sem contato.`, href: '/clientes' })
  if (hotLeads.length) alerts.push({ id: 'a-leads', severity: 'oportunidade', title: 'Leads quentes no pipeline', body: `${mx(hotLeads.reduce((s, l) => s + l.value, 0))}/mês em negociação.`, href: '/comercial' })
  alerts.push({ id: 'a-sum', severity: 'info', title: 'Panorama do dia', body: `${GINGA_CLIENTS.length} clientes · ${mx(mrr)}/mês de MRR.`, href: '/dashboard' })
  return { firstName: 'Estevam', members, staleClients, lateTasks, pendingApprovals, hotLeads, overdue: [], totals: { clients: GINGA_CLIENTS.length, mrr, tasksOpen: GINGA_TASKS.filter((t) => t.status !== 'concluido').length, leadsOpen: GINGA_LEADS.filter((l) => !['fechado', 'perdido'].includes(l.stage)).length }, alerts }
}

export default async function AtlasPage() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const today = todayISO()
        const [{ data: prof }, { data: cls }, { data: tks }, { data: apps }, { data: lds }, { data: fin }] = await Promise.all([
          supabase.from('profiles').select('id, full_name, role').in('role', ['dono', 'membro']),
          supabase.from('clients').select('id, full_name, extra, created_at').order('full_name'),
          supabase.from('op_tasks').select('id, title, member_id, client_id, status, due_date, created_at'),
          supabase.from('approvals').select('id, title, client_id, status, created_at'),
          supabase.from('leads').select('id, company, value, stage'),
          supabase.from('finance_entries').select('id, description, amount, due_date, status, kind'),
        ])

        const tasks = tks ?? []
        const members = (prof ?? []).map((p) => ({
          name: (p.full_name as string) ?? '—',
          openTasks: tasks.filter((t) => t.member_id === p.id && t.status !== 'concluido').length,
        }))
        const meName = (prof ?? []).find((p) => p.id === user.id)?.full_name as string | undefined

        const lateTasks = tasks.filter((t) => t.status !== 'concluido' && t.due_date && (t.due_date as string) < today).map((t) => ({ title: (t.title as string) ?? 'Tarefa' }))
        const pendingApprovals = (apps ?? []).filter((a) => ['enviado', 'reenviado', 'alteracao'].includes(a.status as string)).map((a) => ({ title: (a.title as string) ?? 'Material' }))
        const hotLeads = (lds ?? []).filter((l) => ['negociacao', 'proposta'].includes(l.stage as string)).sort((a, b) => Number(b.value) - Number(a.value)).slice(0, 3).map((l) => ({ company: (l.company as string) ?? '—', value: Number(l.value) || 0, stage: l.stage as string }))
        const leadsOpen = (lds ?? []).filter((l) => !['fechado', 'perdido'].includes(l.stage as string)).length

        // clientes parados: última atividade (tarefa/aprovação) ou criação do cliente
        const lastActivity = new Map<string, string>()
        const note = (cid: unknown, at: unknown) => {
          if (!cid || !at) return
          const cur = lastActivity.get(cid as string)
          if (!cur || (at as string) > cur) lastActivity.set(cid as string, at as string)
        }
        tasks.forEach((t) => note(t.client_id, t.created_at))
        ;(apps ?? []).forEach((a) => note(a.client_id, a.created_at))
        let mrr = 0
        const staleAll = (cls ?? []).map((c) => {
          const extra = (c.extra as Record<string, unknown> | null) ?? {}
          const status = (extra.status as string) ?? 'ativo'
          if (status === 'ativo') mrr += Number(extra.monthly) || 0
          const ref = lastActivity.get(c.id as string) ?? (c.created_at as string | null)
          return { name: (c.full_name as string) ?? '—', days: daysSince(ref), status }
        })
        const staleClients = staleAll.filter((c) => c.status !== 'prospect' && c.days >= 14).sort((a, b) => b.days - a.days).slice(0, 3).map((c) => ({ name: c.name, days: c.days }))

        const overdue = (fin ?? []).filter((f) => f.kind !== 'pagar' && ['pendente', 'atrasado'].includes(f.status as string) && f.due_date && (f.due_date as string) < today).map((f) => ({ desc: (f.description as string) ?? 'Recebível', amount: Number(f.amount) || 0 }))

        const alerts: AtlasAlert[] = []
        if (overdue.length) alerts.push({ id: 'a-fin', severity: 'urgente', title: `${mx(overdue.reduce((s, o) => s + o.amount, 0))} vencido a receber`, body: overdue.map((o) => o.desc).join('; '), href: '/financeiro' })
        if (lateTasks.length) alerts.push({ id: 'a-late', severity: 'urgente', title: `${lateTasks.length} tarefa(s) atrasada(s)`, body: lateTasks.map((t) => t.title).join('; '), href: '/operacao' })
        if (pendingApprovals.length) alerts.push({ id: 'a-appr', severity: 'atencao', title: `${pendingApprovals.length} aprovações pendentes`, body: 'Aguardando o aval do cliente.', href: '/aprovacoes' })
        if (staleClients.length) alerts.push({ id: 'a-stale', severity: 'atencao', title: `${staleClients.length} cliente(s) parado(s)`, body: `${staleClients[0].name} há ${staleClients[0].days} dias sem atividade.`, href: '/clientes' })
        if (hotLeads.length) alerts.push({ id: 'a-leads', severity: 'oportunidade', title: 'Leads quentes no pipeline', body: `${mx(hotLeads.reduce((s, l) => s + l.value, 0))}/mês em negociação.`, href: '/comercial' })
        alerts.push({ id: 'a-sum', severity: 'info', title: 'Panorama do dia', body: `${(cls ?? []).length} clientes · ${mx(mrr)}/mês de MRR · ${tasks.filter((t) => t.status !== 'concluido').length} tarefas abertas.`, href: '/dashboard' })

        const snapshot: AtlasSnapshot = {
          firstName: (meName ?? 'Estevam').split(' ')[0],
          members, staleClients, lateTasks, pendingApprovals, hotLeads, overdue,
          totals: { clients: (cls ?? []).length, mrr, tasksOpen: tasks.filter((t) => t.status !== 'concluido').length, leadsOpen },
          alerts,
        }
        return <AtlasClient snapshot={snapshot} isRealData />
      }
    } catch {
      // fallback demo
    }
  }

  return <AtlasClient snapshot={demoSnapshot()} isRealData={false} />
}
