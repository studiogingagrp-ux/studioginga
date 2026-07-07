import type { Metadata } from 'next'
import { ConfiguracoesView } from '@/components/configuracoes/configuracoes-view'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { createClient } from '@/lib/supabase/server'
import { getWorkspaceBranding } from '@/lib/actions/branding'

export const metadata: Metadata = { title: 'Configurações' }
export const dynamic = 'force-dynamic'

export default async function ConfiguracoesPage() {
  let initialName: string | undefined
  let initialColor: string | undefined
  let isRealData = false
  let isDono = true

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        isDono = ['dono', 'super_admin'].includes((prof?.role as string) ?? '')
      }
      const ws = await getWorkspaceBranding()
      if (ws) {
        initialName = (ws.name as string) ?? undefined
        initialColor = (ws.brand_color as string | null) ?? undefined
        isRealData = true
      }
    } catch {
      // fallback demo
    }
  }

  return <ConfiguracoesView initialName={initialName} initialColor={initialColor} isRealData={isRealData} isDono={isDono} />
}
