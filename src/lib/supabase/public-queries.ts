import { createAdminClient } from './admin'
import type { DemoMember } from '@/lib/demo/data'

export async function getBookedSlots(workspaceId: string, memberId: string, date: string): Promise<string[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('events')
      .select('starts_at')
      .eq('workspace_id', workspaceId)
      .eq('member_id', memberId)
      .gte('starts_at', `${date}T00:00:00`)
      .lte('starts_at', `${date}T23:59:59`)
      .not('status', 'in', '(cancelado,faltou)')
    return (data ?? []).map((a) => {
      const d = new Date(a.starts_at as string)
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    })
  } catch {
    return []
  }
}

export interface PublicWorkspace {
  id: string
  name: string
  slug: string
  logo_url: string | null
  brand_color: string | null
  settings: Record<string, unknown>
}

export async function getPublicWorkspace(slug: string): Promise<PublicWorkspace | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('workspaces')
      .select('id, name, slug, logo_url, brand_color, settings')
      .eq('slug', slug)
      .single()
    return (data as PublicWorkspace | null)
  } catch {
    return null
  }
}

export async function getPublicMembers(workspaceId: string): Promise<DemoMember[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, jobTitle, agenda_color')
      .eq('workspace_id', workspaceId)
      .eq('role', 'membro')
      .eq('active', true)
      .order('full_name')

    if (!data || data.length === 0) return []

    return (data as Array<Record<string, unknown>>).map((p) => {
      const name   = p.full_name as string
      const parts  = name.split(' ')
      const initials = parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : name.substring(0, 2).toUpperCase()
      return {
        id:        p.id as string,
        name,
        jobTitle: (p.jobTitle as string | null) ?? 'Clínico',
        color:     (p.agenda_color as string | null) ?? '#b08d4e',
        initials,
      }
    })
  } catch {
    return []
  }
}
