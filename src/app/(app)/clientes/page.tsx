import type { Metadata } from 'next'
import { ClientesView, type ClienteRow } from '@/components/clientes/clientes-view'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { createClient } from '@/lib/supabase/server'
import type { ClienteStatus } from '@/lib/actions/clients'

export const metadata: Metadata = { title: 'Clientes' }
export const dynamic = 'force-dynamic'

export default async function ClientesPage() {
  let initial: ClienteRow[] | null = null
  let isRealData = false

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('clients')
          .select('id, full_name, phone, email, extra')
          .order('created_at', { ascending: false })
        initial = (data ?? []).map((c) => {
          const extra = (c.extra as Record<string, unknown>) ?? {}
          return {
            id: c.id as string,
            name: (c.full_name as string) ?? '—',
            segment: (extra.segment as string) ?? '',
            contact: (extra.contact as string) ?? '',
            phone: (c.phone as string) ?? '',
            email: (c.email as string | null) ?? '',
            monthly: Number(extra.monthly) || 0,
            status: (extra.status as ClienteStatus) ?? 'ativo',
          }
        })
        isRealData = true
      }
    } catch {
      // fallback demo
    }
  }

  return <ClientesView initialClients={initial} isRealData={isRealData} />
}
