import type { Metadata } from 'next'
import { FinanceiroView } from '@/components/financeiro/financeiro-view'

export const metadata: Metadata = { title: 'Finanças' }
export const dynamic = 'force-dynamic'

export default function FinanceiroPage() {
  return <FinanceiroView />
}
