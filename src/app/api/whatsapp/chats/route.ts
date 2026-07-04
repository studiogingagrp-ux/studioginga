import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchChats, isEvolutionConfigured } from '@/lib/evolution-api'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!isEvolutionConfigured()) {
      return NextResponse.json({ chats: [] })
    }

    const raw = await fetchChats()
    const list = Array.isArray(raw) ? raw : (raw?.chats ?? raw?.data ?? [])

    const chats = list.slice(0, 30).map((c: Record<string, unknown>, i: number) => {
      const jid: string = (c.id as Record<string, string>)?.remote ?? (c.remoteJid as string) ?? ''
      const phone = jid.replace(/@.*/, '').replace(/[^\d]/g, '')
      const name: string = (c.name as string) ?? (c.pushName as string) ?? phone
      const lastMsg = c.lastMessage as Record<string, unknown> | undefined
      const lastBody: string =
        (lastMsg?.message as Record<string, string>)?.conversation ??
        (lastMsg?.message as Record<string, Record<string, string>>)?.extendedTextMessage?.text ??
        '…'
      const ts = (lastMsg?.messageTimestamp as number) ?? 0
      const lastAt = ts
        ? new Date(ts * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : ''

      return {
        id: jid || `chat-${i}`,
        jid,
        phone,
        name,
        initials: name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase(),
        lastBody,
        lastAt,
        unread: (c.unreadCount as number) ?? 0,
      }
    })

    return NextResponse.json({ chats })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
