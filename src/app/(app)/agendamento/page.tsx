import type { Metadata } from 'next'
import { PublicLinkManager } from '@/components/agendamento/public-link-manager'

export const metadata: Metadata = { title: 'Link público' }
export const dynamic = 'force-dynamic'

export default function AgendamentoPage() {
  return <PublicLinkManager />
}
