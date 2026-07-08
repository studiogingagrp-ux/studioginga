import { NextResponse, type NextRequest } from 'next/server'
import { syncAllBilling } from '@/lib/billing'

export const dynamic = 'force-dynamic'

const clean = (s: string) => s.replace(/[^\x20-\x7E]/g, '').trim()

function authorized(req: NextRequest): boolean {
  const secret = clean(process.env.CRON_SECRET || '')
  if (!secret) return false
  const header = req.headers.get('authorization') || ''
  return header === `Bearer ${secret}`
}

/** Cron diário (Vercel) + chamada manual autenticada: sincroniza cobranças. */
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    const results = await syncAllBilling()
    return NextResponse.json({ ok: true, results })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'erro' }, { status: 500 })
  }
}
