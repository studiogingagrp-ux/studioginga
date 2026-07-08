import { NextResponse } from 'next/server'
import { logoutInstance, isEvolutionConfigured } from '@/lib/evolution-api'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['dono', 'super_admin'].includes((prof?.role as string) ?? '')) {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
  }
  if (!isEvolutionConfigured()) return NextResponse.json({ error: 'não configurado' }, { status: 400 })

  try {
    await logoutInstance()
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'Erro' }, { status: 200 })
  }
}
