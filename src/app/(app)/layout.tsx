import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { BillingBanner, BillingBlockedScreen } from '@/components/billing/billing-gate'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import type { Role } from '@/lib/constants/roles'
import type { WorkspaceBranding } from '@/lib/branding'
import type { CmdClient } from '@/components/layout/command-palette'
import type { Permissions } from '@/lib/constants/features'
import { getDemoSession } from '@/lib/demo/session'

export const dynamic = 'force-dynamic'

interface Billing { blocked: boolean; dueDate: string | null; paymentLink: string | null; daysLeft: number | null }

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const demo          = await getDemoSession()
  let role: Role      = demo.role
  let name            = demo.name
  let workspaceName      = 'Ginga Studio'
  let workspaceBranding: WorkspaceBranding | null = null
  let clients: CmdClient[] = []
  let permissions: Permissions = null
  let billing: Billing | null = null

  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name, workspace_id')
        .eq('id', user.id)
        .single()

      // permissions só existe após a migration 010 — busca à parte, tolerante
      try {
        const { data: permRow } = await supabase.from('profiles').select('permissions').eq('id', user.id).single()
        permissions = (permRow?.permissions as Permissions) ?? null
      } catch { permissions = null }

      if (profile) {
        role = (profile.role as Role) ?? role
        name = profile.full_name || name

        // Logado mas sem agência → completar onboarding do dono.
        if (!profile.workspace_id) redirect('/onboarding')

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

          // Cobrança da plataforma (colunas da migration 009 — tolera ausência).
          try {
            const { data: bill } = await supabase
              .from('workspaces')
              .select('billing_due_date, billing_blocked, billing_payment_link')
              .eq('id', profile.workspace_id)
              .single()
            if (bill) {
              const due = (bill.billing_due_date as string | null)
              const today = new Date().toISOString().split('T')[0]
              const daysLeft = due
                ? Math.round((Date.parse(`${due}T12:00:00`) - Date.parse(`${today}T12:00:00`)) / 86400000)
                : null
              billing = {
                // Bloqueia com OVERDUE confirmado no Asaas OU 1+ dia após o vencimento
                blocked: !!bill.billing_blocked || (daysLeft !== null && daysLeft < 0),
                dueDate: due,
                paymentLink: (bill.billing_payment_link as string | null),
                daysLeft,
              }
            }
          } catch {
            // migration 009 ainda não aplicada — segue sem cobrança
          }
        }
      }
    }
  }

  // Vencida há 1+ dia → tela de bloqueio (super admin nunca é bloqueado).
  if (billing?.blocked && role !== 'super_admin') {
    return <BillingBlockedScreen dueDate={billing.dueDate} paymentLink={billing.paymentLink} workspaceName={workspaceName} />
  }

  const showBanner = billing && !billing.blocked && billing.daysLeft !== null && billing.daysLeft <= 5

  return (
    <AppShell role={role} name={name} workspaceName={workspaceName} workspaceBranding={workspaceBranding} clients={clients} permissions={permissions}>
      {showBanner && billing?.dueDate && (
        <BillingBanner daysLeft={billing.daysLeft as number} dueDate={billing.dueDate} paymentLink={billing.paymentLink} />
      )}
      {children}
    </AppShell>
  )
}
