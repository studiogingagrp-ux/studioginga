import type { Metadata } from 'next'
import { CampaignsBoard } from '@/components/campanhas/campaigns-board'
import { getTasks } from '@/lib/supabase/marketing-queries'
import { DEMO_TASKS } from '@/lib/demo/marketing'

export const metadata: Metadata = { title: 'Campanhas' }
export const dynamic = 'force-dynamic'

export default async function CampanhasPage() {
  let initialTasks = DEMO_TASKS
  let isReal = false

  try {
    const tasks = await getTasks()
    if (tasks.length > 0) {
      initialTasks = tasks
      isReal = true
    }
  } catch {
    // Fallback para demo
  }

  return <CampaignsBoard initialTasks={initialTasks} isRealData={isReal} />
}
