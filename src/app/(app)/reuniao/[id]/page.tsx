import type { Metadata } from 'next'
import { MeetingRoom } from '@/components/reuniao/meeting-room'
import { getMeetingDetail } from '@/lib/supabase/marketing-queries'
import type { MeetingDetail } from '@/types/database'

export const metadata: Metadata = { title: 'Sala da reunião' }
export const dynamic = 'force-dynamic'

export default async function ReuniaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let initialDetail: MeetingDetail | null = null
  let isReal = false
  try {
    initialDetail = await getMeetingDetail(id)
    if (initialDetail) isReal = true
  } catch {
    // Fallback para demo
  }

  return <MeetingRoom eventId={id} initialDetail={initialDetail} isRealData={isReal} />
}
