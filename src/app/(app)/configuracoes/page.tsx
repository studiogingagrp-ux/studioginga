import type { Metadata } from 'next'
import { ConfiguracoesView } from '@/components/configuracoes/configuracoes-view'

export const metadata: Metadata = { title: 'Configurações' }
export const dynamic = 'force-dynamic'

export default function ConfiguracoesPage() {
  return <ConfiguracoesView />
}
