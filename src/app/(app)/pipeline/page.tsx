import type { Metadata } from 'next'
import { PipelineBoard } from '@/components/pipeline/pipeline-board'
import { getLeads } from '@/lib/supabase/marketing-queries'
import { DEMO_LEADS } from '@/lib/demo/marketing'

export const metadata: Metadata = { title: 'Pipeline' }
export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  let initialLeads = DEMO_LEADS
  let isReal = false

  try {
    const leads = await getLeads()
    if (leads.length > 0) {
      initialLeads = leads
      isReal = true
    }
  } catch {
    // Fallback para demo
  }

  return <PipelineBoard initialLeads={initialLeads} isRealData={isReal} />
}
