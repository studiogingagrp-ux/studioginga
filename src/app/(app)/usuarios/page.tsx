import type { Metadata } from 'next'
import { UsersManager } from '@/components/usuarios/users-manager'
import { getTeamMembers } from '@/lib/supabase/queries'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Equipe & Acessos' }
export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
  let initialMembers = null
  let isRealData = false
  let currentUserId: string | undefined

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      currentUserId = user?.id
      initialMembers = await getTeamMembers()
      isRealData = true
    } catch {
      // fallback demo
    }
  }

  return <UsersManager initialMembers={initialMembers} isRealData={isRealData} currentUserId={currentUserId} />
}
