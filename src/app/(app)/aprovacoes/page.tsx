import type { Metadata } from 'next'
import { AprovacoesBoard, type ApprovalRow, type Opt } from '@/components/aprovacoes/aprovacoes-board'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { createClient } from '@/lib/supabase/server'
import type { ApprovalStatus, ApprovalType } from '@/types/database'

export const metadata: Metadata = { title: 'Aprovações' }
export const dynamic = 'force-dynamic'

const TYPE_PREVIEW: Record<string, string> = { arte: 'gold', video: 'green', campanha: 'orange', post: 'violet', story: 'sky', landing: 'sky', copy: 'violet', documento: 'gold' }
const dateOnly = (t: string) => (t || '').split('T')[0]

export default async function AprovacoesPage() {
  let initial: ApprovalRow[] | null = null
  let clients: Opt[] = []
  let isRealData = false

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const [{ data: apps }, { data: cls }, { data: cms }] = await Promise.all([
          supabase.from('approvals').select('id, title, client_id, type, status, version, caption, created_at').order('created_at', { ascending: false }),
          supabase.from('clients').select('id, full_name').order('full_name'),
          supabase.from('approval_comments').select('id, approval_id, author, from_client, text, created_at').order('created_at', { ascending: true }),
        ])
        clients = (cls ?? []).map((c) => ({ id: c.id as string, name: c.full_name as string }))
        const nameOf = new Map(clients.map((c) => [c.id, c.name]))
        const commentsByApproval = new Map<string, ApprovalRow['comments']>()
        for (const c of cms ?? []) {
          const arr = commentsByApproval.get(c.approval_id as string) ?? []
          arr.push({ id: c.id as string, author: (c.author as string) ?? '—', fromClient: !!c.from_client, text: (c.text as string) ?? '', at: dateOnly(c.created_at as string) })
          commentsByApproval.set(c.approval_id as string, arr)
        }
        initial = (apps ?? []).map((a) => ({
          id: a.id as string,
          title: (a.title as string) ?? '',
          clientId: (a.client_id as string | null) ?? null,
          clientName: nameOf.get(a.client_id as string) ?? '—',
          type: (a.type as ApprovalType) ?? 'arte',
          status: (a.status as ApprovalStatus) ?? 'enviado',
          version: Number(a.version) || 1,
          caption: (a.caption as string | null) ?? '',
          preview: TYPE_PREVIEW[a.type as string] ?? 'gold',
          comments: commentsByApproval.get(a.id as string) ?? [],
          at: dateOnly(a.created_at as string),
        }))
        isRealData = true
      }
    } catch {
      // fallback demo
    }
  }

  return <AprovacoesBoard initialItems={initial} clients={clients} isRealData={isRealData} />
}
