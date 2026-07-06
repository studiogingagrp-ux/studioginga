import 'server-only'

const BASE = 'https://api.asaas.com/v3'

function authHeaders(): Record<string, string> {
  const key = process.env.ASAAS_API_KEY
  if (!key) throw new Error('ASAAS_API_KEY não configurada')
  return { access_token: key, 'User-Agent': 'GingaStudioOS' }
}

async function asaasGet(path: string) {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders(), cache: 'no-store' })
  if (!res.ok) throw new Error(`Asaas ${res.status}`)
  return res.json()
}

export interface SubRow {
  id: string; customer: string; email?: string; value: number
  cycle: string; status: string; nextDueDate?: string
}
export interface OverdueRow {
  id: string; customer: string; value: number; dueDate: string; invoiceUrl?: string
}
export interface BillingOverview {
  ok: boolean
  error?: string
  mrr: number
  activeCount: number
  clientCount: number
  overdueTotal: number
  subscriptions: SubRow[]
  overdue: OverdueRow[]
}

const CYCLE_MRR: Record<string, number> = {
  WEEKLY: 4.33, BIWEEKLY: 2.17, MONTHLY: 1, QUARTERLY: 1 / 3,
  SEMIANNUALLY: 1 / 6, YEARLY: 1 / 12,
}

/** Panorama de cobranças puxado ao vivo do Asaas (conta do dono/GRP). */
export async function getBillingOverview(): Promise<BillingOverview> {
  const empty = { mrr: 0, activeCount: 0, clientCount: 0, overdueTotal: 0, subscriptions: [] as SubRow[], overdue: [] as OverdueRow[] }
  try {
    const [subsRes, custRes, overdueRes] = await Promise.all([
      asaasGet('/subscriptions?limit=100'),
      asaasGet('/customers?limit=100'),
      asaasGet('/payments?status=OVERDUE&limit=100'),
    ])

    const custMap = new Map<string, { name: string; email?: string }>()
    for (const c of custRes.data ?? []) custMap.set(c.id, { name: c.name, email: c.email })

    const subscriptions: SubRow[] = (subsRes.data ?? []).map((s: Record<string, unknown>) => ({
      id: s.id as string,
      customer: custMap.get(s.customer as string)?.name ?? (s.customer as string),
      email: custMap.get(s.customer as string)?.email,
      value: Number(s.value) || 0,
      cycle: (s.cycle as string) ?? 'MONTHLY',
      status: (s.status as string) ?? 'ACTIVE',
      nextDueDate: s.nextDueDate as string | undefined,
    }))

    const mrr = subscriptions
      .filter((s) => s.status === 'ACTIVE')
      .reduce((a, s) => a + s.value * (CYCLE_MRR[s.cycle] ?? 1), 0)

    const overdue: OverdueRow[] = (overdueRes.data ?? []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      customer: custMap.get(p.customer as string)?.name ?? (p.customer as string),
      value: Number(p.value) || 0,
      dueDate: p.dueDate as string,
      invoiceUrl: p.invoiceUrl as string | undefined,
    }))

    return {
      ok: true,
      mrr,
      activeCount: subscriptions.filter((s) => s.status === 'ACTIVE').length,
      clientCount: custMap.size,
      overdueTotal: overdue.reduce((a, o) => a + o.value, 0),
      subscriptions,
      overdue,
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Falha ao consultar o Asaas', ...empty }
  }
}
