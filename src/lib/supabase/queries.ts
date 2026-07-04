import { createClient } from './server'
import type { DemoEvent, DemoMember } from '@/lib/demo/data'
import type { DemoClient } from '@/lib/demo/clients'

// ── helper ────────────────────────────────────────────────────────────
function toHHMM(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function durationMin(start: string, end: string) {
  return Math.max(30, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000))
}

// ── DASHBOARD ─────────────────────────────────────────────────────────
export async function getDashboardData() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [{ data: appts }, { count: clientsCount }, { count: newClientsCount }] = await Promise.all([
    supabase
      .from('events')
      .select(`
        id, starts_at, ends_at, status, type, title,
        clients(full_name, phone),
        profiles!member_id(full_name)
      `)
      .gte('starts_at', `${today}T00:00:00`)
      .lte('starts_at', `${today}T23:59:59`)
      .order('starts_at'),
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `${today.substring(0, 7)}-01`),
  ])

  const list = (appts ?? []) as Array<Record<string, unknown>>
  const counts = {
    total:      list.length,
    confirmado: list.filter((a) => a.status === 'confirmado' || a.status === 'em_andamento').length,
    cancelado:  list.filter((a) => a.status === 'cancelado').length,
    faltou:     list.filter((a) => a.status === 'nao_compareceu').length,
    clients:    clientsCount ?? 0,
    newClients: newClientsCount ?? 0,
    reunioes:   list.filter((a) => a.type === 'reuniao' || a.type === 'call').length,
  }

  // Empresa e usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('workspace_id, full_name')
    .single()
  let workspaceName = ''
  let userName = ''
  if (profile) {
    userName = (profile.full_name as string | null) ?? ''
    if (profile.workspace_id) {
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('name')
        .eq('id', profile.workspace_id)
        .single()
      workspaceName = (workspace?.name as string | null) ?? ''
    }
  }

  return { counts, appts: list, workspaceName, userName }
}

// ── PACIENTES ─────────────────────────────────────────────────────────
export async function getClients(): Promise<DemoClient[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('clients')
    .select(`
      id, full_name, phone, company, email,
      events(starts_at)
    `)
    .order('full_name')

  if (!data) return []

  return (data as Array<Record<string, unknown>>).map((p) => {
    const appts = (p.events as Array<{ starts_at: string }> | null) ?? []
    const last = appts.sort((a, b) => b.starts_at.localeCompare(a.starts_at))[0]
    return {
      id:        p.id as string,
      name:      p.full_name as string,
      phone:     p.phone as string,
      company:  (p.company as string | null) ?? '—',
      lastVisit: last ? new Date(last.starts_at).toLocaleDateString('pt-BR') : '—',
      email:     (p.email as string | null) ?? undefined,
    }
  })
}

// ── PROFISSIONAIS (para agenda) ────────────────────────────────────────
export async function getMembers(): Promise<DemoMember[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, job_title, agenda_color, role')
    .in('role', ['dono', 'membro'])
    .eq('active', true)
    .order('full_name')

  if (!data || data.length === 0) return []

  return (data as Array<Record<string, unknown>>).map((p) => {
    const name = p.full_name as string
    const parts = name.split(' ')
    const initials = parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase()
    return {
      id:        p.id as string,
      name,
      jobTitle: (p.job_title as string | null) ?? 'Equipe',
      color:     (p.agenda_color as string | null) ?? '#4f46e5',
      initials,
      isOwner:   p.role === 'dono',
    }
  })
}

// ── STATS SEMANAIS (dashboard chart) ─────────────────────────────────
export interface DayStat {
  label: string   // 'Seg 28'
  date:  string   // '2026-06-28'
  total:      number
  confirmado: number
  cancelado:  number
  faltou:     number
}

export async function getWeeklyStats(): Promise<DayStat[]> {
  const supabase = await createClient()

  const end   = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 6)

  const startStr = start.toISOString().split('T')[0]
  const endStr   = end.toISOString().split('T')[0]

  const { data } = await supabase
    .from('events')
    .select('starts_at, status')
    .gte('starts_at', `${startStr}T00:00:00`)
    .lte('starts_at', `${endStr}T23:59:59`)

  const map = new Map<string, DayStat>()
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const date  = d.toISOString().split('T')[0]
    const label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })
      .replace('.', '').replace(/^\w/, (c) => c.toUpperCase())
    map.set(date, { label, date, total: 0, confirmado: 0, cancelado: 0, faltou: 0 })
  }

  for (const row of (data ?? []) as Array<{ starts_at: string; status: string }>) {
    const date = row.starts_at.split('T')[0]
    const day  = map.get(date)
    if (!day) continue
    day.total++
    if (['confirmado', 'chegou', 'em_atendimento', 'finalizado'].includes(row.status)) day.confirmado++
    if (row.status === 'cancelado') day.cancelado++
    if (row.status === 'faltou')    day.faltou++
  }

  return Array.from(map.values())
}

// ── PROFISSIONAIS (manager) ───────────────────────────────────────────
export interface ProManager {
  id: string
  name: string
  jobTitle: string
  whatsapp: string
  color: string
  initials: string
  active: boolean
}

export async function getMembersForManager(): Promise<ProManager[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, job_title, phone, agenda_color, active')
    .in('role', ['dono', 'membro'])
    .order('full_name')

  if (!data) return []

  return (data as Array<Record<string, unknown>>).map((p) => {
    const name = p.full_name as string
    const parts = name.split(' ')
    const initials = parts.slice(0, 2).map((n) => n[0] ?? '').join('').toUpperCase()
    return {
      id:        p.id as string,
      name,
      jobTitle: (p.job_title as string | null) ?? 'Equipe',
      whatsapp:  (p.phone as string | null) ?? '—',
      color:     (p.agenda_color as string | null) ?? '#4f46e5',
      initials,
      active:    (p.active as boolean | null) ?? true,
    }
  })
}

// ── LISTA DE ESPERA ───────────────────────────────────────────────────
export interface WaitlistEntry {
  id: string
  clientId: string
  title: string
  phone: string
  member: string
  memberId: string | null
  preferred: string
  priority: 'alta' | 'normal'
  status: 'aguardando' | 'notificado'
  since: string
}

export async function getWaitlist(): Promise<WaitlistEntry[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('waitlist')
    .select(`
      id, priority, status, notes, created_at, preferred_from, preferred_to, member_id,
      clients(id, full_name, phone),
      profiles!member_id(full_name)
    `)
    .in('status', ['aguardando', 'notificado'])
    .order('priority', { ascending: false })
    .order('created_at')

  if (!data) return []

  return (data as Array<Record<string, unknown>>).map((w) => {
    const client = w.clients as { id: string; full_name: string; phone: string } | null
    const pro     = w.profiles as { full_name: string } | null
    const created = new Date(w.created_at as string)
    const diffMs  = Date.now() - created.getTime()
    const diffH   = Math.floor(diffMs / 3600000)
    const diffD   = Math.floor(diffMs / 86400000)
    const since   = diffD >= 1 ? `há ${diffD} dia${diffD > 1 ? 's' : ''}` : diffH >= 1 ? `há ${diffH}h` : 'agora'

    const prefFrom = w.preferred_from as string | null
    const prefTo   = w.preferred_to   as string | null
    const preferred = prefFrom
      ? prefTo && prefTo !== prefFrom
        ? `${prefFrom} → ${prefTo}`
        : prefFrom
      : (w.notes as string | null) ?? 'Qualquer horário'

    return {
      id:             w.id as string,
      clientId:      client?.id ?? '',
      title:    client?.full_name ?? '—',
      phone:          client?.phone ?? '',
      member:   pro?.full_name ?? 'Qualquer',
      memberId: (w.member_id as string | null) ?? null,
      preferred,
      priority:       ((w.priority as number | null) ?? 0) > 0 ? 'alta' : 'normal',
      status:         w.status as 'aguardando' | 'notificado',
      since,
    }
  })
}

// ── USUÁRIOS / EQUIPE ────────────────────────────────────────────────
export interface TeamMember {
  id: string
  name: string
  email: string
  role: 'dono' | 'membro' | 'membro'
  active: boolean
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, active')
    .in('role', ['dono', 'membro', 'membro'])
    .order('role')
    .order('full_name')

  if (!data) return []

  return (data as Array<Record<string, unknown>>).map((p) => ({
    id:     p.id as string,
    name:   (p.full_name as string) || '—',
    email:  (p.email as string | null) ?? '—',
    role:   p.role as 'dono' | 'membro' | 'membro',
    active: (p.active as boolean | null) ?? true,
  }))
}

// ── RELATÓRIOS ────────────────────────────────────────────────────────
const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export interface ReportData {
  monthly:      { m: string; v: number }[]
  attendance:   { m: string; comp: number; falta: number }[]
  byCompany:   { name: string; value: number }[]
  byMember: { name: string; v: number }[]
  kpis: {
    total6m:      number
    attendanceRate: number
    newClients:  number
    growth:       string
  }
}

export async function getReportData(): Promise<ReportData> {
  const supabase = await createClient()

  const now = new Date()
  const startOfPeriod = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const startStr = startOfPeriod.toISOString()

  const [{ data: appts }, { data: clients }] = await Promise.all([
    supabase
      .from('events')
      .select('starts_at, status, clients(company), profiles!member_id(full_name)')
      .gte('starts_at', startStr)
      .neq('type', 'bloqueio'),
    supabase
      .from('clients')
      .select('company, created_at')
      .gte('created_at', startStr),
  ])

  const apptList = (appts ?? [] as unknown) as Array<{
    starts_at: string
    status: string
    clients: { company: string | null } | null
    profiles: { full_name: string } | null
  }>

  // Build 6-month map
  const monthKeys: string[] = []
  const monthLabels: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    monthLabels.push(MONTH_LABELS[d.getMonth()])
  }

  const monthCount  = new Map(monthKeys.map((k) => [k, 0]))
  const monthComp   = new Map(monthKeys.map((k) => [k, 0]))
  const monthFalta  = new Map(monthKeys.map((k) => [k, 0]))
  const companyMap = new Map<string, number>()
  const proMap      = new Map<string, number>()

  for (const a of apptList) {
    const key = a.starts_at.substring(0, 7)
    if (monthCount.has(key)) {
      monthCount.set(key, (monthCount.get(key) ?? 0) + 1)
      if (['confirmado', 'chegou', 'em_atendimento', 'finalizado', 'agendado'].includes(a.status)) {
        monthComp.set(key, (monthComp.get(key) ?? 0) + 1)
      }
      if (a.status === 'faltou') monthFalta.set(key, (monthFalta.get(key) ?? 0) + 1)
    }
    const proName = a.profiles?.full_name ?? 'Outros'
    const shortName = proName.replace(/^(Dra?\.?\s*)/i, '').split(' ').slice(0, 2).join(' ')
    proMap.set(shortName, (proMap.get(shortName) ?? 0) + 1)
  }

  for (const p of (clients ?? []) as Array<{ company: string | null }>) {
    const c = p.company ?? 'Particular'
    companyMap.set(c, (companyMap.get(c) ?? 0) + 1)
  }

  const monthly    = monthKeys.map((k, i) => ({ m: monthLabels[i], v: monthCount.get(k) ?? 0 }))
  const attendance = monthKeys.map((k, i) => {
    const tot  = monthCount.get(k) ?? 0
    const comp = monthComp.get(k) ?? 0
    const fal  = monthFalta.get(k) ?? 0
    const compPct = tot > 0 ? Math.round((comp / tot) * 100) : 0
    const faltPct = tot > 0 ? Math.round((fal  / tot) * 100) : 0
    return { m: monthLabels[i], comp: compPct, falta: faltPct }
  })
  const byCompany = Array.from(companyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, cnt]) => {
      const total = (clients ?? []).length || 1
      return { name, value: Math.round((cnt / total) * 100) }
    })
  const byMember = Array.from(proMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, v]) => ({ name, v }))

  const total6m   = apptList.length
  const compTotal = apptList.filter((a) => ['confirmado', 'chegou', 'em_atendimento', 'finalizado', 'agendado'].includes(a.status)).length
  const attendanceRate = total6m > 0 ? Math.round((compTotal / total6m) * 100) : 0

  // Growth: last 30 vs prev 30
  const last30  = new Date(); last30.setDate(last30.getDate() - 30)
  const prev30  = new Date(); prev30.setDate(prev30.getDate() - 60)
  const lastStr = last30.toISOString().split('T')[0]
  const prevStr = prev30.toISOString().split('T')[0]
  const c1 = apptList.filter((a) => a.starts_at >= `${lastStr}T00:00:00`).length
  const c2 = apptList.filter((a) => a.starts_at >= `${prevStr}T00:00:00` && a.starts_at < `${lastStr}T00:00:00`).length
  const growthNum = c2 > 0 ? Math.round(((c1 - c2) / c2) * 100) : 0
  const growth = growthNum >= 0 ? `+${growthNum}%` : `${growthNum}%`

  return {
    monthly,
    attendance,
    byCompany: byCompany.length ? byCompany : [{ name: 'Particular', value: 100 }],
    byMember: byMember.length ? byMember : [],
    kpis: { total6m, attendanceRate, newClients: (clients ?? []).length, growth },
  }
}

// ── PORTAL MÉDICO ─────────────────────────────────────────────────────
export interface MedicoEvent {
  id: string
  title: string
  phone: string
  company: string
  start: string
  durationMin: number
  status: string
  type: string
  notes?: string
  clientId: string
}

export async function getMedicoTodayEvents(): Promise<{
  events: MedicoEvent[]
  doctor: { name: string; jobTitle: string } | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { events: [], doctor: null }

  const today = new Date().toISOString().split('T')[0]

  const [{ data: profile }, { data: appts }] = await Promise.all([
    supabase.from('profiles').select('full_name, jobTitle').eq('id', user.id).single(),
    supabase
      .from('events')
      .select('id, starts_at, ends_at, status, type, notes, title, clients(id, full_name, phone, company)')
      .eq('member_id', user.id)
      .gte('starts_at', `${today}T00:00:00`)
      .lte('starts_at', `${today}T23:59:59`)
      .neq('type', 'bloqueio')
      .order('starts_at'),
  ])

  const doctor = profile
    ? { name: (profile.full_name as string | null) ?? 'Membro', jobTitle: (profile.jobTitle as string | null) ?? 'Membro' }
    : null

  const events: MedicoEvent[] = (appts ?? []).map((a) => {
    const raw     = a as Record<string, unknown>
    const pArr    = raw.clients as Array<{ id: string; full_name: string; phone: string; company: string | null }> | null
    const client = Array.isArray(pArr) ? pArr[0] : (pArr as typeof pArr)
    return {
      id:          raw.id as string,
      title: client?.full_name ?? (raw.title as string | null) ?? 'Cliente',
      phone:       client?.phone ?? '',
      company:    client?.company ?? 'Particular',
      start:       toHHMM(raw.starts_at as string),
      durationMin: durationMin(raw.starts_at as string, raw.ends_at as string),
      status:      raw.status as string,
      type:        raw.type   as string,
      notes:       raw.notes  as string | undefined,
      clientId:   client?.id ?? '',
    }
  })

  return { events, doctor }
}

// ── AGENDAMENTOS ──────────────────────────────────────────────────────
export async function getEventsByDate(date: string): Promise<DemoEvent[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select(`
      id, starts_at, ends_at, status, type, visibility, title, notes, member_id, client_id,
      clients(id, full_name, phone, company)
    `)
    .gte('starts_at', `${date}T00:00:00`)
    .lte('starts_at', `${date}T23:59:59`)
    .order('starts_at')

  if (!data) return []

  return (data as Array<Record<string, unknown>>).map((a) => {
    const pArr    = a.clients as Array<{ id: string; full_name: string; phone: string; company?: string }> | { id: string; full_name: string; phone: string; company?: string } | null
    const client = Array.isArray(pArr) ? pArr[0] : pArr
    return {
      id:              a.id as string,
      memberId:  a.member_id as string,
      clientId:       client?.id ?? (a.client_id as string | null) ?? undefined,
      title:     client?.full_name ?? (a.title as string | null) ?? 'Bloqueio',
      phone:           client?.phone ?? '',
      company:        client?.company,
      start:           toHHMM(a.starts_at as string),
      durationMin:     durationMin(a.starts_at as string, a.ends_at as string),
      status:          a.status as DemoEvent['status'],
      type:            a.type as DemoEvent['type'],
      visibility:      (a.visibility as DemoEvent['visibility'] | null) ?? 'equipe',
      notes:           a.notes as string | undefined,
    }
  })
}
