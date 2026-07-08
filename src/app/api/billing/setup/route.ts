import { NextResponse, type NextRequest } from 'next/server'
import { updateAsaasCustomer, getAsaasSubscription, getAsaasCustomer } from '@/lib/billing'

export const dynamic = 'force-dynamic'

const clean = (s: string) => s.replace(/[^\x20-\x7E]/g, '').trim()

function authorized(req: NextRequest): boolean {
  const secret = clean(process.env.CRON_SECRET || '')
  if (!secret) return false
  return (req.headers.get('authorization') || '') === `Bearer ${secret}`
}

/**
 * Manutenção autenticada da cobrança (uso interno GRP):
 * POST { customerId, subscriptionId, email?, mobilePhone? }
 * Atualiza o cadastro no Asaas e retorna cliente + assinatura p/ conferência.
 */
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const customerId = String(body.customerId || '')
    const subscriptionId = String(body.subscriptionId || '')
    if (!customerId) return NextResponse.json({ error: 'customerId obrigatório' }, { status: 400 })

    if (body.email || body.mobilePhone) {
      await updateAsaasCustomer(customerId, {
        ...(body.email ? { email: String(body.email) } : {}),
        ...(body.mobilePhone ? { mobilePhone: String(body.mobilePhone) } : {}),
      })
    }
    const customer = await getAsaasCustomer(customerId)
    const subscription = subscriptionId ? await getAsaasSubscription(subscriptionId) : null
    return NextResponse.json({
      ok: true,
      customer: { id: customer.id, name: customer.name, email: customer.email, mobilePhone: customer.mobilePhone, notificationDisabled: customer.notificationDisabled },
      subscription: subscription && { id: subscription.id, status: subscription.status, value: subscription.value, cycle: subscription.cycle, nextDueDate: subscription.nextDueDate },
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'erro' }, { status: 500 })
  }
}
