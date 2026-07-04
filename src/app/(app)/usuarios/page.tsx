import type { Metadata } from 'next'
import { UsersManager } from '@/components/usuarios/users-manager'
import { getTeamMembers } from '@/lib/supabase/queries'
import { isSupabaseConfigured } from '@/lib/supabase/client'

export const metadata: Metadata = { title: 'Usuários' }
export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
  let initialMembers = null
  let isRealData = false

  if (isSupabaseConfigured()) {
    try {
      initialMembers = await getTeamMembers()
      isRealData = true
    } catch {
      // fallback demo
    }
  }

  return <UsersManager initialMembers={initialMembers} isRealData={isRealData} />
}
