'use server'

/**
 * Ações públicas do Portal do Cliente.
 *
 * O visitante NÃO tem sessão — o "token" de acesso é o UUID do cliente
 * (aleatório/não-enumerável, tipo link do Google Docs). Toda ação valida
 * que o recurso pertence ao cliente do token antes de gravar, usando o
 * admin client (service role) APENAS no servidor.
 */

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function portalActOnApproval(input: {
  clientId: string
  approvalId: string
  action: 'aprovado' | 'alteracao'
  comment?: string
  authorName?: string
}) {
  const { clientId, approvalId, action, comment, authorName } = input
  if (!UUID_RE.test(clientId) || !UUID_RE.test(approvalId)) return { error: 'Link inválido.' }
  if (!['aprovado', 'alteracao'].includes(action)) return { error: 'Ação inválida.' }

  const admin = createAdminClient()

  // O material precisa pertencer ao cliente do link — sem isso, nada grava.
  const { data: appr, error: findErr } = await admin
    .from('approvals')
    .select('id, client_id, workspace_id, status')
    .eq('id', approvalId)
    .eq('client_id', clientId)
    .single()
  if (findErr || !appr) return { error: 'Material não encontrado.' }

  const { error: upErr } = await admin
    .from('approvals')
    .update({ status: action })
    .eq('id', approvalId)
  if (upErr) return { error: 'Não foi possível registrar agora. Tente de novo.' }

  if (comment?.trim()) {
    await admin.from('approval_comments').insert({
      approval_id: approvalId,
      author: (authorName || 'Cliente').slice(0, 80),
      from_client: true,
      text: comment.trim().slice(0, 2000),
    })
  }

  revalidatePath('/aprovacoes')
  return { ok: true }
}
