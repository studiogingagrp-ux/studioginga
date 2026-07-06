import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/admin/admin-shell'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  // Área do dono/GRP — protege os dados de cobrança: só super_admin logado entra.
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin') redirect('/login')
  }
  return <AdminShell>{children}</AdminShell>
}
