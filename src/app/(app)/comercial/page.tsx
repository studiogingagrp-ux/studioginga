import type { Metadata } from 'next'
import { ComercialBoard } from '@/components/comercial/comercial-board'

export const metadata: Metadata = { title: 'Comercial' }
export const dynamic = 'force-dynamic'

export default function ComercialPage() {
  return <ComercialBoard />
}
