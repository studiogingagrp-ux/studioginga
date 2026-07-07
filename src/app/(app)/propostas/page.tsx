import type { Metadata } from 'next'
import { PropostasView, type ClientOpt } from '@/components/propostas/propostas-view'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Propostas & Contratos' }
export const dynamic = 'force-dynamic'

const STATUS_SET = new Set(['rascunho', 'enviada', 'aceita', 'recusada'])
function shortDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Hoje'
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default async function PropostasPage() {
  let initialProposals: { id: string; clientId: string; templateName: string; value: number; status: 'rascunho' | 'enviada' | 'aceita' | 'recusada'; at: string }[] | null = null
  let clients: ClientOpt[] = []
  let isRealData = false

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const [{ data: props }, { data: cls }] = await Promise.all([
          supabase.from('proposals').select('id, client_id, title, value, status, created_at').order('created_at', { ascending: false }),
          supabase.from('clients').select('id, full_name, phone, extra').order('full_name'),
        ])
        clients = (cls ?? []).map((c) => {
          const extra = (c.extra as Record<string, unknown> | null) ?? {}
          return {
            id: c.id as string,
            name: (c.full_name as string) ?? '—',
            contact: (extra.contact as string) ?? '',
            phone: (c.phone as string) ?? '',
          }
        })
        initialProposals = (props ?? []).map((p) => ({
          id: p.id as string,
          clientId: (p.client_id as string | null) ?? '',
          templateName: (p.title as string) ?? 'Proposta',
          value: Number(p.value) || 0,
          status: (STATUS_SET.has(p.status as string) ? p.status : 'rascunho') as 'rascunho' | 'enviada' | 'aceita' | 'recusada',
          at: shortDate(p.created_at as string | null),
        }))
        isRealData = true
      }
    } catch {
      // fallback demo
    }
  }

  return <PropostasView initialProposals={initialProposals} clients={clients} isRealData={isRealData} />
}
