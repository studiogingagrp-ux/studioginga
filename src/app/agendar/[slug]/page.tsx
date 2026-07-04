import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { getPublicMembers } from '@/lib/supabase/public-queries'
import { PublicBooking } from '@/components/cliente/public-booking'
import { brandVars, DEFAULT_BRAND, type WorkspaceSettings } from '@/lib/branding'
import type { DemoMember } from '@/lib/demo/data'

export const dynamic = 'force-dynamic'

interface WorkspaceData {
  id: string
  name: string
  logo_url: string | null
  brand_color: string | null
  settings: WorkspaceSettings | null
}

async function loadWorkspace(slug: string): Promise<{ workspace: WorkspaceData; members: DemoMember[] } | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const supabase = createAdminClient()
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, name, logo_url, brand_color, settings')
      .eq('slug', slug)
      .eq('status', 'ativa')
      .single()
    if (!workspace) return null

    const members = await getPublicMembers(workspace.id)
    return { workspace: workspace as WorkspaceData, members }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const data = await loadWorkspace(slug)
  const name = data?.workspace.name ?? 'Atlas Agenda'
  return { title: `Agendar reunião — ${name}` }
}

export default async function AgendarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await loadWorkspace(slug)

  if (!data && isSupabaseConfigured()) notFound()

  const workspace: WorkspaceData = data?.workspace ?? {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Atlas Agenda Center',
    logo_url: null,
    brand_color: '#4f46e5',
    settings: { tagline: 'Sua equipe · Uma visão só' },
  }
  const members = data?.members ?? []

  const settings = workspace.settings ?? {}
  const vars = brandVars({ brand_color: workspace.brand_color ?? DEFAULT_BRAND, settings })

  return (
    <div className="min-h-screen bg-secondary/40" style={vars}>
      <PublicBooking
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        members={members}
      />
    </div>
  )
}
