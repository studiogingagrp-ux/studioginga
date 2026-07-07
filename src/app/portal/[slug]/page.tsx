import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ClientPortal, type PortalApproval, type PortalProject, type PortalMeeting } from '@/components/portal/client-portal'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { GINGA_CLIENTS, GINGA_PROJECTS, GINGA_APPROVALS, GINGA_AGENDA } from '@/lib/demo/agency'
import type { ApprovalStatus, ApprovalType, ProjectStatus } from '@/types/database'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TYPE_PREVIEW: Record<string, string> = { arte: 'gold', video: 'green', campanha: 'orange', post: 'violet', story: 'sky', landing: 'sky', copy: 'violet', documento: 'gold' }

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

interface PortalData {
  clientId: string; clientName: string; contactName: string
  agency: string; agencyPhone: string | null
  projects: PortalProject[]; approvals: PortalApproval[]; meetings: PortalMeeting[]
  isRealData: boolean
}

/** Busca real: o slug É o UUID do cliente (token não-enumerável). */
async function loadReal(slug: string): Promise<PortalData | null> {
  if (!UUID_RE.test(slug)) return null
  try {
    const admin = createAdminClient()
    const { data: client } = await admin
      .from('clients')
      .select('id, full_name, workspace_id, extra')
      .eq('id', slug)
      .single()
    if (!client) return null

    const nowISO = new Date().toISOString()
    const [{ data: ws }, { data: prjs }, { data: apps }, { data: cms }, { data: evs }] = await Promise.all([
      admin.from('workspaces').select('name, phone').eq('id', client.workspace_id).single(),
      admin.from('projects').select('id, name, status, progress').eq('client_id', client.id).order('created_at', { ascending: false }),
      admin.from('approvals').select('id, title, type, status, version, caption').eq('client_id', client.id).order('created_at', { ascending: false }),
      admin.from('approval_comments').select('approval_id'),
      admin.from('events').select('id, starts_at, title, type').eq('client_id', client.id).gte('starts_at', nowISO).order('starts_at').limit(5),
    ])

    const commentCount = new Map<string, number>()
    for (const c of cms ?? []) commentCount.set(c.approval_id as string, (commentCount.get(c.approval_id as string) ?? 0) + 1)

    const extra = (client.extra as Record<string, unknown> | null) ?? {}
    return {
      clientId: client.id as string,
      clientName: (client.full_name as string) ?? 'Cliente',
      contactName: ((extra.contact as string) || (client.full_name as string) || 'Cliente'),
      agency: (ws?.name as string) ?? 'Ginga Studio',
      agencyPhone: (ws?.phone as string | null) ?? null,
      projects: (prjs ?? []).map((p) => ({ id: p.id as string, name: (p.name as string) ?? '—', status: (p.status as ProjectStatus) ?? 'producao', progress: Number(p.progress) || 0 })),
      approvals: (apps ?? []).map((a) => ({
        id: a.id as string,
        title: (a.title as string) ?? '—',
        type: (a.type as ApprovalType) ?? 'arte',
        status: (a.status as ApprovalStatus) ?? 'enviado',
        version: Number(a.version) || 1,
        caption: (a.caption as string | null) ?? '',
        preview: TYPE_PREVIEW[a.type as string] ?? 'gold',
        commentsCount: commentCount.get(a.id as string) ?? 0,
      })),
      meetings: (evs ?? []).map((e) => ({
        id: e.id as string,
        time: new Date(e.starts_at as string).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ' ' + new Date(e.starts_at as string).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        title: (e.title as string) || 'Reunião',
        kind: (e.type as string) ?? 'reuniao',
      })),
      isRealData: true,
    }
  } catch {
    return null
  }
}

/** Demo: só quando o Supabase não está configurado (dev local). */
function loadDemo(slug: string): PortalData | null {
  const c = GINGA_CLIENTS.find((x) => slugify(x.name) === slug)
  if (!c) return null
  return {
    clientId: c.id, clientName: c.name, contactName: c.contact,
    agency: 'Ginga Studio', agencyPhone: null,
    projects: GINGA_PROJECTS.filter((p) => p.clientId === c.id).map((p) => ({ id: p.id, name: p.name, status: p.status, progress: p.progress })),
    approvals: GINGA_APPROVALS.filter((a) => a.clientId === c.id).map((a) => ({ id: a.id, title: a.title, type: a.type, status: a.status, version: a.version, caption: a.caption, preview: a.preview, commentsCount: a.comments.length })),
    meetings: GINGA_AGENDA.filter((m) => m.clientId === c.id).map((m) => ({ id: m.id, time: m.time, title: m.title, kind: m.kind })),
    isRealData: false,
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  if (isSupabaseConfigured() && UUID_RE.test(slug)) {
    const d = await loadReal(slug)
    return { title: `${d?.clientName ?? 'Cliente'} · Portal` }
  }
  return { title: 'Portal do cliente' }
}

export default async function PortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const data = isSupabaseConfigured()
    ? await loadReal(slug)
    : loadDemo(slug)

  if (!data) notFound()

  return (
    <ClientPortal
      clientId={data.clientId}
      clientName={data.clientName}
      contactName={data.contactName}
      agency={data.agency}
      agencyPhone={data.agencyPhone}
      projects={data.projects}
      approvals={data.approvals}
      meetings={data.meetings}
      isRealData={data.isRealData}
    />
  )
}
