import type { Metadata } from 'next'
import { getDemoSession } from '@/lib/demo/session'
import { MeuDiaView, type MyTask, type MyEvent, type MyApproval } from '@/components/meu-dia/meu-dia-view'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { createClient } from '@/lib/supabase/server'
import type { OpTaskStatus, OpTaskType, Priority, ApprovalStatus, ApprovalType } from '@/types/database'

export const metadata: Metadata = { title: 'Meu Dia' }
export const dynamic = 'force-dynamic'

export default async function MeuDiaPage() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const today = new Date().toISOString().split('T')[0]
        const [{ data: me }, { data: tks }, { data: evs }, { data: apps }, { data: cls }] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('id', user.id).single(),
          supabase.from('op_tasks').select('id, title, client_id, type, status, priority, due_date').eq('member_id', user.id).order('due_date', { ascending: true, nullsFirst: false }),
          supabase.from('events').select('id, starts_at, title, type, client_id').eq('member_id', user.id).gte('starts_at', `${today}T00:00:00`).lte('starts_at', `${today}T23:59:59`).order('starts_at'),
          supabase.from('approvals').select('id, title, client_id, type, status, version').in('status', ['enviado', 'reenviado', 'alteracao']).order('created_at', { ascending: false }).limit(6),
          supabase.from('clients').select('id, full_name'),
        ])
        const clientName = new Map((cls ?? []).map((c) => [c.id as string, (c.full_name as string) ?? '—']))

        const tasks: MyTask[] = (tks ?? []).map((t) => ({
          id: t.id as string,
          title: (t.title as string) ?? '—',
          clientName: clientName.get(t.client_id as string) ?? 'Interno',
          type: (t.type as OpTaskType) ?? 'arte',
          status: (t.status as OpTaskStatus) ?? 'a_fazer',
          priority: (t.priority as Priority) ?? 'media',
          due: (t.due_date as string | null),
        }))
        const agenda: MyEvent[] = (evs ?? []).map((e) => ({
          id: e.id as string,
          time: new Date(e.starts_at as string).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          title: (e.title as string) || 'Compromisso',
          clientName: clientName.get(e.client_id as string) ?? null,
          kind: (e.type as string) ?? 'reuniao',
        }))
        const approvals: MyApproval[] = (apps ?? []).map((a) => ({
          id: a.id as string,
          title: (a.title as string) ?? '—',
          clientName: clientName.get(a.client_id as string) ?? '—',
          type: (a.type as ApprovalType) ?? 'arte',
          status: (a.status as ApprovalStatus) ?? 'enviado',
          version: Number(a.version) || 1,
        }))

        return (
          <MeuDiaView
            name={(me?.full_name as string) ?? 'Colaborador'}
            memberId={user.id}
            initialTasks={tasks}
            initialAgenda={agenda}
            initialApprovals={approvals}
            isRealData
          />
        )
      }
    } catch {
      // fallback demo
    }
  }

  const { name, memberId } = await getDemoSession()
  return <MeuDiaView name={name} memberId={memberId} />
}
