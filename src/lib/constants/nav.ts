import {
  LayoutDashboard, CalendarDays, FolderKanban, KanbanSquare, BadgeCheck,
  Target, Users, TrendingUp, Wallet, Megaphone, MessageCircle, Sparkles,
  UserCog, Settings, BarChart3, Zap, Video, Timer, MapPin, Plug, FileText, Sun, ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/lib/constants/roles'

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

/** Navegação do Ginga Studio OS — a operação de uma agência de marketing. */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Operação',
    items: [
      { href: '/meu-dia',    label: 'Meu Dia',    icon: Sun,             roles: ['membro'] },
      { href: '/dashboard',  label: 'Comando',    icon: LayoutDashboard, roles: ['dono'] },
      { href: '/agenda',     label: 'Agenda',     icon: CalendarDays },
      { href: '/reunioes',   label: 'Reuniões',   icon: Video },
      { href: '/projetos',   label: 'Projetos',   icon: FolderKanban },
      { href: '/operacao',   label: 'Operação',   icon: KanbanSquare },
      { href: '/tempo',      label: 'Time Tracking', icon: Timer },
      { href: '/check-in',   label: 'Check-in',   icon: MapPin },
      { href: '/aprovacoes', label: 'Aprovações', icon: BadgeCheck },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { href: '/comercial',  label: 'Comercial',  icon: Target,   roles: ['dono'] },
      { href: '/propostas',  label: 'Propostas',  icon: FileText, roles: ['dono'] },
      { href: '/clientes',   label: 'Clientes',   icon: Users },
      { href: '/growth',     label: 'Growth',     icon: TrendingUp, roles: ['dono'] },
      { href: '/financeiro', label: 'Financeiro', icon: Wallet,     roles: ['dono'] },
    ],
  },
  {
    label: 'Conteúdo',
    items: [
      { href: '/conteudo',   label: 'Conteúdo',   icon: Megaphone },
      { href: '/whatsapp',   label: 'WhatsApp',   icon: MessageCircle, roles: ['dono'] },
    ],
  },
  {
    label: 'Inteligência',
    items: [
      { href: '/atlas',      label: 'Atlas IA',    icon: Sparkles },
      { href: '/relatorios', label: 'Relatórios',  icon: BarChart3, roles: ['dono'] },
      { href: '/automacoes', label: 'Automações',  icon: Zap,       roles: ['dono'] },
    ],
  },
]

export const NAV_FOOTER: NavItem[] = [
  { href: '/equipe',        label: 'Equipe',        icon: UserCog,     roles: ['dono'] },
  { href: '/usuarios',      label: 'Usuários',      icon: ShieldCheck, roles: ['dono'] },
  { href: '/integracoes',   label: 'Integrações',   icon: Plug,        roles: ['dono'] },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

/** Um item é visível se não declara papéis ou se inclui o papel atual. */
function visibleTo(item: NavItem, role: Role): boolean {
  return !item.roles || item.roles.includes(role)
}

/** Seções de navegação filtradas pelo papel (remove seções que ficam vazias). */
export function navSectionsForRole(role: Role): NavSection[] {
  return NAV_SECTIONS
    .map((s) => ({ ...s, items: s.items.filter((i) => visibleTo(i, role)) }))
    .filter((s) => s.items.length > 0)
}

/** Itens do rodapé filtrados pelo papel. */
export function navFooterForRole(role: Role): NavItem[] {
  return NAV_FOOTER.filter((i) => visibleTo(i, role))
}
