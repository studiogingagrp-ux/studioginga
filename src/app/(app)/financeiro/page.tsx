import type { Metadata } from 'next'
import { FinanceiroView } from '@/components/financeiro/financeiro-view'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Finanças' }
export const dynamic = 'force-dynamic'

interface Entry { id: string; kind: 'receber' | 'pagar'; description: string; amount: number; due: string; paid: boolean; contato?: string }

export default async function FinanceiroPage() {
  let initial: Entry[] | null = null
  let isRealData = false

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('finance_entries')
          .select('id, kind, description, amount, due_date, status, contact')
          .order('due_date', { ascending: true })
        if (!error) {
          initial = (data ?? []).map((e) => ({
            id: e.id as string,
            kind: ((e.kind as string) === 'pagar' ? 'pagar' : 'receber') as 'receber' | 'pagar',
            description: (e.description as string) ?? '',
            amount: Number(e.amount) || 0,
            due: (e.due_date as string) ?? new Date().toISOString().split('T')[0],
            paid: (e.status as string) === 'pago',
            contato: (e.contact as string | null) ?? undefined,
          }))
          isRealData = true
        }
      }
    } catch {
      // fallback demo
    }
  }

  return <FinanceiroView initialEntries={initial} isRealData={isRealData} />
}
