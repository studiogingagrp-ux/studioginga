import type { Metadata } from 'next'
import { AutomacoesView } from '@/components/automacoes/automacoes-view'

export const metadata: Metadata = { title: 'Automações' }
export const dynamic = 'force-dynamic'

export default function AutomacoesPage() {
  return <AutomacoesView />
}
