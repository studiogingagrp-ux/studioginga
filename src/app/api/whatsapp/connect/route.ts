import { NextResponse } from 'next/server'
import { getConnectionQr, isEvolutionConfigured } from '@/lib/evolution-api'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/** Retorna o QR code (ou estado 'open' se já conectado) pra parear o WhatsApp. */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // só dono/super_admin conectam o WhatsApp da agência
  const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['dono', 'super_admin'].includes((prof?.role as string) ?? '')) {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
  }

  if (!isEvolutionConfigured()) {
    return NextResponse.json({ configured: false, state: 'not_configured' })
  }

  try {
    const qr = await getConnectionQr()
    return NextResponse.json({ configured: true, ...qr })
  } catch (e) {
    return NextResponse.json(
      { configured: true, state: 'error', error: e instanceof Error ? e.message : 'Erro ao gerar QR' },
      { status: 200 },
    )
  }
}
