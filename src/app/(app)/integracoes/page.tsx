import type { Metadata } from 'next'
import { IntegracoesView } from '@/components/integracoes/integracoes-view'

export const metadata: Metadata = { title: 'Integrações' }
export const dynamic = 'force-dynamic'

export default function IntegracoesPage() {
  return <IntegracoesView />
}
