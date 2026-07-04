import type { Metadata } from 'next'
import { CheckinView } from '@/components/checkin/checkin-view'

export const metadata: Metadata = { title: 'Check-in' }
export const dynamic = 'force-dynamic'

export default function CheckinPage() {
  return <CheckinView />
}
