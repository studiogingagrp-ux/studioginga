import type { Metadata } from 'next'
import { AprovacoesBoard } from '@/components/aprovacoes/aprovacoes-board'

export const metadata: Metadata = { title: 'Aprovações' }
export const dynamic = 'force-dynamic'

export default function AprovacoesPage() {
  return <AprovacoesBoard />
}
