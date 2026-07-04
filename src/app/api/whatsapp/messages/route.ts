import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchMessages, isEvolutionConfigured } from '@/lib/evolution-api'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const jid = searchParams.get('jid')
  if (!jid) return NextResponse.json({ error: 'Missing jid' }, { status: 400 })

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!isEvolutionConfigured()) return NextResponse.json({ messages: [] })

    const raw = await fetchMessages(jid, 30)
    const list: Record<string, unknown>[] = Array.isArray(raw)
      ? raw
      : (raw?.messages?.records ?? raw?.data ?? [])

    const messages = list.map((m: Record<string, unknown>) => {
      const key = m.key as Record<string, unknown>
      const isOut = key?.fromMe === true
      const msgContent = m.message as Record<string, unknown>
      const body: string =
        (msgContent?.conversation as string) ??
        (msgContent?.extendedTextMessage as Record<string, string>)?.text ??
        '…'
      const ts = (m.messageTimestamp as number) ?? 0
      const time = ts
        ? new Date(ts * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : ''

      return {
        id: (m.key as Record<string, string>)?.id ?? crypto.randomUUID(),
        direction: isOut ? 'out' : 'in',
        body,
        time,
        status: isOut ? 'read' : undefined,
      }
    })

    return NextResponse.json({ messages })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
