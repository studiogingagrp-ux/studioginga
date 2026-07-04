import type { Metadata } from 'next'
import { PropostasView } from '@/components/propostas/propostas-view'

export const metadata: Metadata = { title: 'Propostas & Contratos' }
export const dynamic = 'force-dynamic'

export default function PropostasPage() {
  return <PropostasView />
}
