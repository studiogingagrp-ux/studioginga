import type { Metadata } from 'next'
import { ConfiguracoesView } from '@/components/configuracoes/configuracoes-view'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { getWorkspaceBranding } from '@/lib/actions/branding'

export const metadata: Metadata = { title: 'Configurações' }
export const dynamic = 'force-dynamic'

export default async function ConfiguracoesPage() {
  let initialName: string | undefined
  let initialColor: string | undefined
  let isRealData = false

  if (isSupabaseConfigured()) {
    try {
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

  return <ConfiguracoesView initialName={initialName} initialColor={initialColor} isRealData={isRealData} />
}
