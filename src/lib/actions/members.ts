'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function toggleMember(id: string, active: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ active })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/equipe')
  revalidatePath('/agenda')
  return { success: true }
}

export async function updateMemberColor(id: string, color: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ agenda_color: color })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/equipe')
  revalidatePath('/agenda')
  return { success: true }
}
