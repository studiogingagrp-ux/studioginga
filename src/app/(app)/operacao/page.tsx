import type { Metadata } from 'next'
import { OperacaoBoard, type TaskRow, type Opt, type MemberOpt } from '@/components/operacao/operacao-board'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { createClient } from '@/lib/supabase/server'
import { getInitials } from '@/lib/utils'
import type { OpTaskStatus, OpTaskType, Priority } from '@/types/database'

export const metadata: Metadata = { title: 'Operação' }
export const dynamic = 'force-dynamic'

const COLORS = ['#f2b23e', '#f0722a', '#38bdf8', '#a78bfa', '#34d399', '#fb7185']

export default async function OperacaoPage() {
  let initialTasks: TaskRow[] | null = null
  let clients: Opt[] = []
  let members: MemberOpt[] = []
  let isRealData = false

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const [{ data: tks }, { data: cls }, { data: mbs }] = await Promise.all([
          supabase.from('op_tasks').select('id, title, client_id, member_id, type, status, priority, due_date').order('created_at', { ascending: false }),
          supabase.from('clients').select('id, full_name').order('full_name'),
          supabase.from('profiles').select('id, full_name, agenda_color').in('role', ['dono', 'membro']),
        ])
        clients = (cls ?? []).map((c) => ({ id: c.id as string, name: c.full_name as string }))
        members = (mbs ?? []).map((m, i) => ({
          id: m.id as string,
          name: (m.full_name as string) ?? '—',
          color: (m.agenda_color as string | null) ?? COLORS[i % COLORS.length],
          initials: getInitials((m.full_name as string) ?? '—'),
        }))
        initialTasks = (tks ?? []).map((t) => ({
          id: t.id as string,
          title: (t.title as string) ?? '',
          clientId: (t.client_id as string | null) ?? null,
          memberId: (t.member_id as string | null) ?? null,
          type: (t.type as OpTaskType) ?? 'arte',
          status: (t.status as OpTaskStatus) ?? 'a_fazer',
          priority: (t.priority as Priority) ?? 'media',
          due: (t.due_date as string | null) ?? null,
        }))
        isRealData = true
      }
    } catch {
      // fallback demo
    }
  }

  return <OperacaoBoard initialTasks={initialTasks} clients={clients} members={members} isRealData={isRealData} />
}
