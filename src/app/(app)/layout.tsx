import { AppShell } from '@/components/layout/app-shell'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import type { Role } from '@/lib/constants/roles'
import type { WorkspaceBranding } from '@/lib/branding'
import type { CmdClient } from '@/components/layout/command-palette'
import { getDemoSession } from '@/lib/demo/session'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const demo          = await getDemoSession()
  let role: Role      = demo.role
  let name            = demo.name
  let workspaceName      = 'Ginga Studio'
  let workspaceBranding: WorkspaceBranding | null = null
  let clients: CmdClient[] = []

  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name, workspace_id')
        .eq('id', user.id)
        .single()

      if (profile) {
        role = (profile.role as Role) ?? role
        name = profile.full_name || name

        if (profile.workspace_id) {
          const [{ data: workspace }, { data: patData }] = await Promise.all([
            supabase
              .from('workspaces')
              .select('id, name, logo_url, brand_color, settings')
              .eq('id', profile.workspace_id)
              .single(),
            supabase
              .from('clients')
              .select('id, full_name, phone')
              .eq('workspace_id', profile.workspace_id)
              .order('full_name')
              .limit(30),
          ])

          if (workspace) {
            workspaceName    = workspace.name
            workspaceBranding = {
              name:        workspace.name,
              logo_url:    workspace.logo_url,
              brand_color: workspace.brand_color,
              settings:    workspace.settings as WorkspaceBranding['settings'],
            }
          }

          clients = (patData ?? []).map((p) => ({
            id:    p.id as string,
            name:  p.full_name as string,
            phone: (p.phone as string | null) ?? '',
          }))
        }
      }
    }
  }

  return (
    <AppShell role={role} name={name} workspaceName={workspaceName} workspaceBranding={workspaceBranding} clients={clients}>
      {children}
    </AppShell>
  )
}
