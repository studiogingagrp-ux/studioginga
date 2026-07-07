'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createSupabase } from '@/lib/supabase/server'

export interface FinanceInput {
  kind: 'receber' | 'pagar'
  description: string
  amount: number
  due: string
  contact?: string
}

async function ctx() {
  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, ws: null as string | null }
  const { data } = await supabase.from('profiles').select('workspace_id').eq('id', user.id).single()
  return { supabase, ws: (data?.workspace_id as string | null) ?? null }
}

export async function createFinanceEntry(input: FinanceInput) {
  const { supabase, ws } = await ctx()
  if (!ws) return { error: 'Agência não encontrada.' }
  if (!input.description?.trim() || !input.amount) return { error: 'Informe descrição e valor.' }

  const { data, error } = await supabase
    .from('finance_entries')
    .insert({
      workspace_id: ws,
      kind: input.kind,
      description: input.description.trim(),
      amount: Number(input.amount) || 0,
      due_date: input.due,
      status: 'pendente',
      contact: input.contact?.trim() || null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/financeiro')
  return { ok: true, id: data.id as string }
}

export async function toggleFinancePaid(id: string, paid: boolean) {
  const { supabase } = await ctx()
  const { error } = await supabase
    .from('finance_entries')
    .update({ status: paid ? 'pago' : 'pendente', paid_at: paid ? new Date().toISOString() : null })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/financeiro')
  return { ok: true }
}

export async function removeFinanceEntry(id: string) {
  const { supabase } = await ctx()
  const { error } = await supabase.from('finance_entries').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/financeiro')
  return { ok: true }
}
