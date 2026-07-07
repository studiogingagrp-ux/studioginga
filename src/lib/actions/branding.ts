'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { WorkspaceSettings } from '@/lib/branding'

export async function saveWorkspaceBranding(data: {
  name?: string
  logo_url?: string
  brand_color?: string
  settings?: Partial<WorkspaceSettings>
}): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('workspace_id, role')
    .single()

  if (profileError || !profile?.workspace_id) {
    return { error: 'Empresa não encontrada' }
  }
  if (!['dono', 'super_admin'].includes((profile.role as string) ?? '')) {
    return { error: 'Apenas o dono pode alterar a marca da agência.' }
  }

  // Merge settings parcial com o existente
  if (data.settings) {
    const { data: current } = await supabase
      .from('workspaces')
      .select('settings')
      .eq('id', profile.workspace_id)
      .single()

    const merged = { ...(current?.settings ?? {}), ...data.settings }

    const { error } = await supabase
      .from('workspaces')
      .update({
        ...(data.name       ? { name: data.name }             : {}),
        ...(data.logo_url   ? { logo_url: data.logo_url }     : {}),
        ...(data.brand_color ? { brand_color: data.brand_color } : {}),
        settings: merged,
      })
      .eq('id', profile.workspace_id)

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('workspaces')
      .update({
        ...(data.name        ? { name: data.name }              : {}),
        ...(data.logo_url    ? { logo_url: data.logo_url }      : {}),
        ...(data.brand_color ? { brand_color: data.brand_color } : {}),
      })
      .eq('id', profile.workspace_id)

    if (error) return { error: error.message }
  }

  revalidatePath('/configuracoes')
  revalidatePath('/', 'layout')
  return {}
}

export async function getWorkspaceBranding() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('workspaces')
    .select('id, name, logo_url, brand_color, settings')
    .single()
  return data
}
