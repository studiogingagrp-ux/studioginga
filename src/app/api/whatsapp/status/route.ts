import { NextResponse } from 'next/server'
import { getInstanceStatus, isEvolutionConfigured } from '@/lib/evolution-api'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isEvolutionConfigured()) {
    return NextResponse.json({ configured: false, state: 'not_configured' })
  }

  try {
    const status = await getInstanceStatus()
    return NextResponse.json({ configured: true, state: status?.instance?.state ?? 'unknown', raw: status })
  } catch (e) {
    return NextResponse.json({ configured: true, state: 'error', error: e instanceof Error ? e.message : 'Erro' })
  }
}
