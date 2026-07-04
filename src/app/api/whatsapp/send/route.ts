import { NextResponse } from 'next/server'
import { sendText, isEvolutionConfigured } from '@/lib/evolution-api'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  // Exige sessão autenticada
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isEvolutionConfigured()) {
    return NextResponse.json({ error: 'Evolution API not configured' }, { status: 503 })
  }

  const { phone, text } = await req.json() as { phone?: string; text?: string }
  if (!phone || !text?.trim()) {
    return NextResponse.json({ error: 'phone and text are required' }, { status: 400 })
  }

  try {
    const result = await sendText(phone, text.trim())
    return NextResponse.json({ success: true, result })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro ao enviar' }, { status: 500 })
  }
}
