import type { Metadata } from 'next'
import { OperacaoBoard } from '@/components/operacao/operacao-board'

export const metadata: Metadata = { title: 'Operação' }
export const dynamic = 'force-dynamic'

export default function OperacaoPage() {
  return <OperacaoBoard />
}
