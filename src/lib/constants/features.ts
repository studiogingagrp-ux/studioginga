import type { Role } from '@/lib/constants/roles'

/**
 * Funções que o Dono pode LIBERAR ou BLOQUEAR por colaborador (estilo BelezaPro).
 * A chave é o prefixo da rota (sem a barra). Dono e super_admin têm tudo sempre.
 */
export interface Feature { key: string; label: string; href: string; hint: string }

export const FEATURES: Feature[] = [
  { key: 'meu-dia',    label: 'Meu Dia',    href: '/meu-dia',    hint: 'Tarefas e agenda do próprio colaborador' },
  { key: 'agenda',     label: 'Agenda',     href: '/agenda',     hint: 'Ver e criar compromissos' },
  { key: 'projetos',   label: 'Projetos',   href: '/projetos',   hint: 'Acompanhar projetos dos clientes' },
  { key: 'operacao',   label: 'Operação',   href: '/operacao',   hint: 'Quadro de tarefas (kanban)' },
  { key: 'aprovacoes', label: 'Aprovações', href: '/aprovacoes', hint: 'Enviar materiais para aprovação' },
  { key: 'clientes',   label: 'Clientes',   href: '/clientes',   hint: 'Ver a carteira de clientes' },
  { key: 'conteudo',   label: 'Conteúdo',   href: '/conteudo',   hint: 'Calendário editorial' },
  { key: 'atlas',      label: 'Atlas IA',   href: '/atlas',      hint: 'Assistente de operações' },
]

export const FEATURE_KEYS = FEATURES.map((f) => f.key)

export type Permissions = Record<string, boolean> | null | undefined

/** Padrão quando o colaborador ainda não teve permissões personalizadas: tudo liberado. */
export function defaultPermissions(): Record<string, boolean> {
  return Object.fromEntries(FEATURES.map((f) => [f.key, true]))
}

/**
 * O colaborador pode acessar a função `key`?
 * - dono / super_admin: sempre sim
 * - membro/convidado: sim se permissions[key] !== false (null = tudo liberado)
 */
export function canAccessFeature(role: Role, permissions: Permissions, key: string): boolean {
  if (role === 'dono' || role === 'super_admin') return true
  if (!permissions) return true // sem personalização = padrão liberado
  return permissions[key] !== false
}

/** Mapeia um pathname para a chave de função (ou null se não é função controlável). */
export function featureKeyForPath(pathname: string): string | null {
  const f = FEATURES.find((x) => pathname === x.href || pathname.startsWith(`${x.href}/`))
  return f?.key ?? null
}
