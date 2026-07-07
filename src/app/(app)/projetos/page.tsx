import type { Metadata } from 'next'
import { ProjetosView, type ProjectRow, type ClientOpt } from '@/components/projetos/projetos-view'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { createClient } from '@/lib/supabase/server'
import type { ProjectStatus, Priority } from '@/types/database'

export const metadata: Metadata = { title: 'Projetos' }
export const dynamic = 'force-dynamic'

export default async function ProjetosPage() {
  let initial: ProjectRow[] | null = null
  let clients: ClientOpt[] = []
  let isRealData = false

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const [{ data: projs }, { data: cls }] = await Promise.all([
          supabase.from('projects').select('id, name, client_id, description, deadline, status, priority, progress').order('created_at', { ascending: false }),
          supabase.from('clients').select('id, full_name').order('full_name'),
        ])
        clients = (cls ?? []).map((c) => ({ id: c.id as string, name: c.full_name as string }))
        const nameOf = new Map(clients.map((c) => [c.id, c.name]))
        initial = (projs ?? []).map((p) => ({
          id: p.id as string,
          name: (p.name as string) ?? '—',
          clientId: (p.client_id as string | null) ?? null,
          clientName: nameOf.get(p.client_id as string) ?? '—',
          description: (p.description as string | null) ?? '',
          deadline: (p.deadline as string | null) ?? null,
          status: (p.status as ProjectStatus) ?? 'planejamento',
          priority: (p.priority as Priority) ?? 'media',
          progress: Number(p.progress) || 0,
        }))
        isRealData = true
      }
    } catch {
      // fallback demo
    }
  }

  return <ProjetosView initialProjects={initial} clients={clients} isRealData={isRealData} />
}
