import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

const BASE = 'https://api.asaas.com/v3'

// Sanitiza contra chars invisíveis nas envs (mesma causa raiz do bug de login).
const clean = (s: string) => s.replace(/[^\x20-\x7E]/g, '').trim()

function headers(): Record<string, string> {
  const key = clean(process.env.ASAAS_API_KEY || '')
  if (!key) throw new Error('ASAAS_API_KEY não configurada')
  return { access_token: key, 'User-Agent': 'GingaStudioOS', 'Content-Type': 'application/json' }
}

async function asaas(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { ...headers(), ...(init?.headers ?? {}) }, cache: 'no-store' })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Asaas ${res.status}: ${JSON.stringify(body).slice(0, 200)}`)
  return body
}

interface PaymentRow { id: string; status: string; dueDate: string; value: number; invoiceUrl?: string }

export interface BillingSyncResult {
  workspaceId: string
  blocked: boolean
  dueDate: string | null
  paymentLink: string | null
  overdueCount: number
}

/**
 * Sincroniza a cobrança de UM workspace com o Asaas:
 * - existe pagamento OVERDUE (vencido e não pago)? → bloqueia
 * - senão → desbloqueia e grava o próximo vencimento PENDING
 */
export async function syncWorkspaceBilling(workspaceId: string): Promise<BillingSyncResult | null> {
  const admin = createAdminClient()
  const { data: ws } = await admin
    .from('workspaces')
    .select('id, asaas_subscription_id')
    .eq('id', workspaceId)
    .single()
  if (!ws?.asaas_subscription_id) return null

  const sub = ws.asaas_subscription_id as string
  const [overdueRes, pendingRes] = await Promise.all([
    asaas(`/payments?subscription=${sub}&status=OVERDUE&limit=10`),
    asaas(`/payments?subscription=${sub}&status=PENDING&limit=10`),
  ])
  const overdue: PaymentRow[] = overdueRes?.data ?? []
  const pending: PaymentRow[] = (pendingRes?.data ?? []).sort((a: PaymentRow, b: PaymentRow) => a.dueDate.localeCompare(b.dueDate))

  const blocked = overdue.length > 0
  const dueDate = blocked ? overdue[0].dueDate : (pending[0]?.dueDate ?? null)
  const paymentLink = blocked
    ? (overdue[0].invoiceUrl ?? null)
    : (pending[0]?.invoiceUrl ?? null)

  await admin
    .from('workspaces')
    .update({
      billing_blocked: blocked,
      billing_due_date: dueDate,
      ...(paymentLink ? { billing_payment_link: paymentLink } : {}),
    })
    .eq('id', workspaceId)

  return { workspaceId, blocked, dueDate, paymentLink, overdueCount: overdue.length }
}

/** Sincroniza todos os workspaces que têm assinatura Asaas vinculada. */
export async function syncAllBilling(): Promise<BillingSyncResult[]> {
  const admin = createAdminClient()
  const { data: rows } = await admin
    .from('workspaces')
    .select('id')
    .not('asaas_subscription_id', 'is', null)
  const out: BillingSyncResult[] = []
  for (const r of rows ?? []) {
    const res = await syncWorkspaceBilling(r.id as string).catch(() => null)
    if (res) out.push(res)
  }
  return out
}

/** Atualiza e-mail/celular do cliente no Asaas (p/ cobrança automática). */
export async function updateAsaasCustomer(customerId: string, data: { email?: string; mobilePhone?: string }) {
  return asaas(`/customers/${customerId}`, { method: 'PUT', body: JSON.stringify(data) })
}

/** Consulta assinatura + cliente (verificação). */
export async function getAsaasSubscription(subscriptionId: string) {
  return asaas(`/subscriptions/${subscriptionId}`)
}
export async function getAsaasCustomer(customerId: string) {
  return asaas(`/customers/${customerId}`)
}
