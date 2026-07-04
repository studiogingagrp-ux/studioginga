/**
 * Perfis de acesso do Atlas Agenda Center.
 * Multi-tenant: todo usuário (exceto super_admin) pertence a um workspace (empresa).
 */
export type Role = 'super_admin' | 'dono' | 'membro' | 'convidado'

export const ROLES: Record<Role, { label: string; home: string }> = {
  super_admin: { label: 'Super Administrador', home: '/admin' },
  dono:        { label: 'Dono',                home: '/dashboard' },
  membro:      { label: 'Colaborador',          home: '/meu-dia' },
  convidado:   { label: 'Convidado',           home: '/agenda' },
}

/** Cookie lido pelo proxy (edge) para roteamento por papel sem hit no banco. */
export const ROLE_COOKIE = 'atlas_user_role'

/** Cookie de demonstração — "ver como" Dono/Colaborador sem Supabase. Client-safe. */
export const DEMO_ROLE_COOKIE = 'ginga_demo_role'

/** Rota inicial de cada papel após login. */
export function homeForRole(role: Role | string | undefined): string {
  return (role && role in ROLES ? ROLES[role as Role].home : '/dashboard')
}

/** Papéis que operam o painel interno do workspace. */
export const STAFF_ROLES: Role[] = ['dono', 'membro']
