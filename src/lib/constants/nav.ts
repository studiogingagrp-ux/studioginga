import {
  LayoutDashboard, CalendarDays, FolderKanban, KanbanSquare, BadgeCheck,
  Target, Users, Wallet, Megaphone, Sparkles, MessageCircle,
  Settings, FileText, Sun, ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/lib/constants/roles'
import { canAccessFeature, featureKeyForPath, type Permissions } from '@/lib/constants/features'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  /** Papéis que enxergam o item. Ausente = todos os papéis internos. */
  roles?: Role[]
}

export interface NavSection {
  label: string
  items: NavItem[]
}

/**
 * Navegação do Ginga Studio OS — a operação de uma agência de marketing.
 *
 * REGRA (auditoria 2026-07-06): só entra na navegação módulo com backend real.
 * Telas demonstrativas (Time Tracking, Check-in, Growth, WhatsApp, Relatórios,
 * Automações, Reuniões, Integrações, Equipe antiga) saíram da nav — voltam
 * quando forem construídas de verdade.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Operação',
    items: [
      { href: '/meu-dia',    label: 'Meu Dia',    icon: Sun,             roles: ['membro'] },
      { href: '/dashboard',  label: 'Comando',    icon: LayoutDashboard, roles: ['dono'] },
      { href: '/agenda',     label: 'Agenda',     icon: CalendarDays },
      { href: '/projetos',   label: 'Projetos',   icon: FolderKanban },
      { href: '/operacao',   label: 'Operação',   icon: KanbanSquare },
      { href: '/aprovacoes', label: 'Aprovações', icon: BadgeCheck },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { href: '/comercial',  label: 'Pipeline',   icon: Target,   roles: ['dono'] },
      { href: '/propostas',  label: 'Propostas',  icon: FileText, roles: ['dono'] },
      { href: '/clientes',   label: 'Clientes',   icon: Users },
      { href: '/financeiro', label: 'Financeiro', icon: Wallet,   roles: ['dono'] },
    ],
  },
  {
    label: 'Conteúdo',
    items: [
      { href: '/conteudo',   label: 'Conteúdo',   icon: Megaphone },
    ],
  },
  {
    label: 'Inteligência',
    items: [
      { href: '/atlas',      label: 'Atlas IA',    icon: Sparkles },
    ],
  },
]

export const NAV_FOOTER: NavItem[] = [
  { href: '/usuarios',      label: 'Equipe & Acessos', icon: ShieldCheck,   roles: ['dono'] },
  { href: '/whatsapp',      label: 'WhatsApp',         icon: MessageCircle, roles: ['dono'] },
  { href: '/configuracoes', label: 'Configurações',    icon: Settings },
]

/**
 * Um item é visível se: (1) o papel permite E (2) a função está liberada
 * nas permissões do colaborador (dono/super_admin ignoram permissões).
 */
function visibleTo(item: NavItem, role: Role, permissions?: Permissions): boolean {
  if (item.roles && !item.roles.includes(role)) return false
  const key = featureKeyForPath(item.href)
  if (key && !canAccessFeature(role, permissions, key)) return false
  return true
}

/** Seções de navegação filtradas pelo papel + permissões (remove seções vazias). */
export function navSectionsForRole(role: Role, permissions?: Permissions): NavSection[] {
  return NAV_SECTIONS
    .map((s) => ({ ...s, items: s.items.filter((i) => visibleTo(i, role, permissions)) }))
    .filter((s) => s.items.length > 0)
}

/** Itens do rodapé filtrados pelo papel + permissões. */
export function navFooterForRole(role: Role, permissions?: Permissions): NavItem[] {
  return NAV_FOOTER.filter((i) => visibleTo(i, role, permissions))
}
