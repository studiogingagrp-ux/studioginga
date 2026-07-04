// Queries dos módulos de marketing (Pipeline, Campanhas, Conteúdo, Reuniões).
// Padrão do projeto: retornam os formatos Demo* para troca direta com o modo demo.
import { createClient } from '@/lib/supabase/server'
import type { LeadStage, TaskStatus, ContentChannel, ContentStatus, MeetingDetail } from '@/types/database'
import type { DemoLead, DemoTask, DemoPost } from '@/lib/demo/marketing'

const daysSince = (iso: string | null) =>
  iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)) : 0

// ── PIPELINE ─────────────────────────────────────────────────
export async function getLeads(): Promise<DemoLead[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('leads')
    .select('id, name, company, phone, value, stage, notes, member_id, stage_since')
    .order('created_at', { ascending: false })

  if (!data) return []
  return (data as Array<Record<string, unknown>>).map((l) => ({
    id:       l.id as string,
    name:     l.name as string,
    company:  (l.company as string | null) ?? '—',
    phone:    (l.phone as string | null) ?? '',
    value:    Number(l.value ?? 0),
    stage:    l.stage as LeadStage,
    memberId: (l.member_id as string | null) ?? '',
    notes:    (l.notes as string | null) ?? undefined,
    days:     daysSince(l.stage_since as string | null),
  }))
}

// ── CAMPANHAS (tarefas) ──────────────────────────────────────
export async function getTasks(): Promise<DemoTask[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tasks')
    .select('id, title, status, due_date, tag, member_id, clients(company, full_name)')
    .order('due_date', { ascending: true })

  if (!data) return []
  return (data as Array<Record<string, unknown>>).map((t) => {
    const cArr = t.clients as Array<{ company: string | null; full_name: string }> | { company: string | null; full_name: string } | null
    const c = Array.isArray(cArr) ? cArr[0] : cArr
    return {
      id:         t.id as string,
      title:      t.title as string,
      clientName: c?.company ?? c?.full_name ?? 'Interno',
      memberId:   t.member_id as string,
      status:     t.status as TaskStatus,
      due:        (t.due_date as string | null) ?? new Date().toISOString().split('T')[0],
      tag:        (t.tag as string | null) ?? undefined,
    }
  })
}

// ── CONTEÚDO ─────────────────────────────────────────────────
export async function getPosts(): Promise<DemoPost[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_posts')
    .select('id, title, channel, status, publish_date, clients(company, full_name)')
    .order('publish_date')

  if (!data) return []
  return (data as Array<Record<string, unknown>>).map((p) => {
    const cArr = p.clients as Array<{ company: string | null; full_name: string }> | { company: string | null; full_name: string } | null
    const c = Array.isArray(cArr) ? cArr[0] : cArr
    return {
      id:         p.id as string,
      title:      p.title as string,
      clientName: c?.company ?? c?.full_name ?? 'Interno',
      channel:    p.channel as ContentChannel,
      status:     p.status as ContentStatus,
      date:       p.publish_date as string,
    }
  })
}

// ── SALA DE REUNIÃO ──────────────────────────────────────────
export async function getMeetingDetail(eventId: string): Promise<MeetingDetail | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('meeting_details')
    .select('event_id, call_url, agenda, notes, actions, updated_at')
    .eq('event_id', eventId)
    .maybeSingle()
  return (data as MeetingDetail | null) ?? null
}
