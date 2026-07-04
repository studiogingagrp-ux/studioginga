import type { Metadata } from 'next'
import { ReunioesView } from '@/components/reunioes/reunioes-view'

export const metadata: Metadata = { title: 'Reuniões' }
export const dynamic = 'force-dynamic'

export default function ReunioesPage() {
  return <ReunioesView />
}
