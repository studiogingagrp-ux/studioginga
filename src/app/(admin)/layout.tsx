import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/admin/admin-shell'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/** Área do dono/GRP — SEMPRE exige super_admin logado (protege dados de cobrança). */
export async function requireSuperAdmin(): Promise<void> {
  let isSuper = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      isSuper = profile?.role === 'super_admin'
    }
  } catch {
    isSuper = false
  }
  if (!isSuper) redirect('/login')
}

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdmin()
  return <AdminShell>{children}</AdminShell>
}
