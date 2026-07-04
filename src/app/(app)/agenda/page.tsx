import type { Metadata } from 'next'
import { AgendaBoard } from '@/components/agenda/agenda-board'
import { getEventsByDate, getMembers, getClients } from '@/lib/supabase/queries'
import { DEMO_EVENTS, DEMO_MEMBERS } from '@/lib/demo/data'

export const metadata: Metadata = { title: 'Agenda' }
export const dynamic = 'force-dynamic'

export default async function AgendaPage() {
  const today = new Date().toISOString().split('T')[0]
  let initialEvents = DEMO_EVENTS
  let initialMembers = DEMO_MEMBERS
  let initialClients = undefined
  let isReal = false

  try {
    const [appts, pros, pats] = await Promise.all([
      getEventsByDate(today),
      getMembers(),
      getClients(),
    ])
    if (pros.length > 0) {
      initialMembers = pros
      initialEvents = appts
      initialClients = pats
      isReal = true
    }
  } catch {
    // Fallback para demo
  }

  return (
    <div className="mx-auto max-w-7xl">
      <AgendaBoard
        initialEvents={initialEvents}
        initialMembers={initialMembers}
        initialClients={initialClients}
        isRealData={isReal}
      />
    </div>
  )
}
