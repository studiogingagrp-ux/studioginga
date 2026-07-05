'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Role } from '@/lib/constants/roles'

interface Me { userId: string; workspace_id: string | null; role: Role; full_name: string }

async function currentProfile(): Promise<Me | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('workspace_id, role, full_name')
    .eq('id', user.id)
    .single()
  if (!data) return null
  return {
    userId: user.id,
    workspace_id: (data.workspace_id as string | null) ?? null,
    role: (data.role as Role) ?? 'membro',
    full_name: (data.full_name as string) ?? '',
  }
}

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40)

const tempPassword = () =>
  Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 4).toUpperCase() + '@' + Math.floor(Math.random() * 90 + 10)

/** Onboarding: o usuário logado cria a própria agência e vira Dono. */
export async function setupWorkspace(agencyName: string): Promise<{ ok?: true; error?: string }> {
  const me = await currentProfile()
  if (!me) return { error: 'Sessão expirada. Faça login novamente.' }
  if (me.workspace_id) return { error: 'Você já tem uma agência configurada.' }
  const name = agencyName.trim()
  if (name.length < 2) return { error: 'Dê um nome para a agência.' }

  const admin = createAdminClient()
  const slug = `${slugify(name) || 'agencia'}-${Math.random().toString(36).slice(2, 6)}`
  const { data: ws, error } = await admin
    .from('workspaces')
    .insert({ name, slug, plan: 'pro', status: 'ativa' })
    .select('id')
    .single()
  if (error || !ws) return { error: error?.message ?? 'Falha ao criar a agência.' }

  const { error: pErr } = await admin
    .from('profiles')
    .update({ workspace_id: ws.id, role: 'dono' })
    .eq('id', me.userId)
  if (pErr) return { error: pErr.message }

  revalidatePath('/', 'layout')
  return { ok: true }
}

/** O dono adiciona um funcionário: cria a conta + o perfil com o papel escolhido. */
export async function createEmployee(input: { name: string; email: string; role: Role }): Promise<{ ok?: true; tempPassword?: string; error?: string }> {
  const me = await currentProfile()
  if (!me) return { error: 'Sessão expirada.' }
  if (me.role !== 'dono') return { error: 'Apenas o dono pode adicionar pessoas.' }
  if (!me.workspace_id) return { error: 'Crie sua agência primeiro.' }

  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  if (!name || !email) return { error: 'Informe nome e e-mail.' }

  const admin = createAdminClient()
  const senha = tempPassword()
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { full_name: name, role: input.role },
  })
  if (error || !created?.user) {
    const msg = /already been registered|exists/i.test(error?.message ?? '')
      ? 'Esse e-mail já tem conta.'
      : (error?.message ?? 'Falha ao criar o usuário.')
    return { error: msg }
  }

  // o gatilho cria o profile; completamos com workspace + papel + nome
  const { error: pErr } = await admin
    .from('profiles')
    .update({ workspace_id: me.workspace_id, role: input.role, full_name: name, email })
    .eq('id', created.user.id)
  if (pErr) return { error: pErr.message }

  revalidatePath('/usuarios')
  return { ok: true, tempPassword: senha }
}

/** Ativa/desativa um funcionário da mesma agência. */
export async function toggleEmployee(id: string, active: boolean): Promise<{ ok?: true; error?: string }> {
  const me = await currentProfile()
  if (!me || me.role !== 'dono') return { error: 'Sem permissão.' }
  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ active })
    .eq('id', id)
    .eq('workspace_id', me.workspace_id)
  if (error) return { error: error.message }
  revalidatePath('/usuarios')
  return { ok: true }
}
