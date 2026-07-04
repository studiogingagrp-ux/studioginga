import type { Metadata } from 'next'
import { TimeTracking } from '@/components/tempo/time-tracking'

export const metadata: Metadata = { title: 'Time Tracking' }
export const dynamic = 'force-dynamic'

export default function TempoPage() {
  return <TimeTracking />
}
