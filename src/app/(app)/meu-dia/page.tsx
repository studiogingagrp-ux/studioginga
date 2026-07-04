import type { Metadata } from 'next'
import { getDemoSession } from '@/lib/demo/session'
import { MeuDiaView } from '@/components/meu-dia/meu-dia-view'

export const metadata: Metadata = { title: 'Meu Dia' }
export const dynamic = 'force-dynamic'

export default async function MeuDiaPage() {
  const { name, memberId } = await getDemoSession()
  return <MeuDiaView name={name} memberId={memberId} />
}
