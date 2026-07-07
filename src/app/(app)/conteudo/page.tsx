import type { Metadata } from 'next'
import { GingaContent, type PostRow, type ClientOpt } from '@/components/conteudo/ginga-content'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { createClient } from '@/lib/supabase/server'
import type { ContentChannel, ContentStatus } from '@/types/database'

export const metadata: Metadata = { title: 'Conteúdo' }
export const dynamic = 'force-dynamic'

export default async function ConteudoPage() {
  let initialPosts: PostRow[] | null = null
  let clients: ClientOpt[] = []
  let isRealData = false

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const now = new Date()
        const first = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        const last = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
        const [{ data: pts }, { data: cls }] = await Promise.all([
          supabase.from('posts').select('id, title, client_id, channel, status, scheduled_on').gte('scheduled_on', first).lte('scheduled_on', last),
          supabase.from('clients').select('id, full_name').order('full_name'),
        ])
        clients = (cls ?? []).map((c) => ({ id: c.id as string, name: (c.full_name as string) ?? '—' }))
        initialPosts = (pts ?? []).map((p) => ({
          id: p.id as string,
          day: Number((p.scheduled_on as string | null)?.split('-')[2]) || 1,
          title: (p.title as string) ?? '',
          clientId: (p.client_id as string | null) ?? '',
          channel: (p.channel as ContentChannel) ?? 'instagram',
          status: (p.status as ContentStatus) ?? 'rascunho',
        }))
        isRealData = true
      }
    } catch {
      // fallback demo
    }
  }

  return <GingaContent initialPosts={initialPosts} clients={clients} isRealData={isRealData} />
}
