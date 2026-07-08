'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createSupabase } from '@/lib/supabase/server'
import { syncWorkspaceBilling } from '@/lib/billing'

/**
 * "Já paguei — verificar": o usuário logado pede a rechecagem da própria
 * cobrança no Asaas. Se o pagamento compensou, desbloqueia na hora.
 */
export async function verifyMyBilling(): Promise<{ ok?: true; blocked?: boolean; error?: string }> {
  const supabase = await createSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada — entre novamente.' }

  const { data: prof } = await supabase.from('profiles').select('workspace_id').eq('id', user.id).single()
  if (!prof?.workspace_id) return { error: 'Agência não encontrada.' }

  try {
    const res = await syncWorkspaceBilling(prof.workspace_id as string)
    revalidatePath('/', 'layout')
    if (!res) return { ok: true, blocked: false }
    return { ok: true, blocked: res.blocked }
  } catch {
    return { error: 'Não foi possível consultar o pagamento agora. Tente em instantes.' }
  }
}
