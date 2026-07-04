import type { Metadata } from 'next'
import { RelatoriosView } from '@/components/relatorios/relatorios-view'

export const metadata: Metadata = { title: 'Relatórios' }
export const dynamic = 'force-dynamic'

export default function RelatoriosPage() {
  return <RelatoriosView />
}
