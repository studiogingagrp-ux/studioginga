import type { EventStatus, EventType, EventVisibility } from '@/types/database'

/**
 * Dados de demonstração — usados enquanto o Supabase não está conectado.
 * A forma espelha as tabelas reais para troca direta por queries depois.
 */

export interface DemoMember {
  id: string
  name: string
  jobTitle: string
  color: string
  initials: string
  isOwner?: boolean
}

export interface DemoEvent {
  id: string
  memberId: string
  clientId?: string
  title: string
  phone: string
  company?: string
  start: string // 'HH:mm'
  durationMin: number
  status: EventStatus
  type: EventType
  visibility: EventVisibility
  notes?: string
  meetLink?: string
  /** Data local 'YYYY-MM-DD' — usada nas visões Semana/Mês (dados reais). */
  date?: string
  /** true quando o conteúdo foi ocultado para quem não é o dono do evento. */
  masked?: boolean
}

/**
 * Usuário simulado no modo demo (Estevam, dono do workspace).
 * Com Supabase conectado, vem do perfil autenticado.
 */
export const DEMO_CURRENT_MEMBER_ID = 'm1'

/** Aplica a regra de privacidade: evento privado de outra pessoa vira "Ocupado". */
export function maskEvent(e: DemoEvent, currentMemberId: string): DemoEvent {
  if (e.visibility !== 'privado' || e.memberId === currentMemberId) return e
  return {
    ...e,
    title: 'Ocupado',
    phone: '',
    company: undefined,
    notes: undefined,
    masked: true,
  }
}

export const DEMO_MEMBERS: DemoMember[] = [
  { id: 'm1', name: 'Estevam',          jobTitle: 'Dono · Direção',     color: '#f59e0b', initials: 'ES', isOwner: true },
  { id: 'm2', name: 'Larissa Campos',   jobTitle: 'Social Media',       color: '#3b82f6', initials: 'LC' },
  { id: 'm3', name: 'Diego Fernandes',  jobTitle: 'Tráfego Pago',       color: '#10b981', initials: 'DF' },
  { id: 'm4', name: 'Paula Mendes',     jobTitle: 'Audiovisual',        color: '#a855f7', initials: 'PM' },
]

export const DEMO_EVENTS: DemoEvent[] = [
  // Estevam (dono) — mistura de eventos de equipe e privados
  { id: 'e1', memberId: 'm1', title: 'Reunião — Clínica Vida Bella',  phone: '5215512345678', company: 'Vida Bella',   start: '09:00', durationMin: 60, status: 'confirmado',   type: 'reuniao',  visibility: 'equipe' },
  { id: 'e2', memberId: 'm1', title: 'Dentista',                      phone: '',                                        start: '11:00', durationMin: 60, status: 'agendado',     type: 'pessoal',  visibility: 'privado' },
  { id: 'e3', memberId: 'm1', title: 'Call — proposta Grupo Andrade', phone: '5215598765432', company: 'Grupo Andrade', start: '14:00', durationMin: 30, status: 'agendado',     type: 'call',     visibility: 'equipe' },
  { id: 'e4', memberId: 'm1', title: 'Análise financeira do mês',     phone: '',                                        start: '16:00', durationMin: 90, status: 'agendado',     type: 'pessoal',  visibility: 'privado' },

  // Larissa — social media
  { id: 'e5', memberId: 'm2', title: 'Planejamento — Café Central',   phone: '5215577778888', company: 'Café Central',  start: '09:30', durationMin: 60, status: 'em_andamento', type: 'interno',  visibility: 'equipe' },
  { id: 'e6', memberId: 'm2', title: 'Aprovação de pauta — Vida Bella', phone: '5215512345678', company: 'Vida Bella',  start: '11:30', durationMin: 30, status: 'confirmado',   type: 'call',     visibility: 'equipe' },
  { id: 'e7', memberId: 'm2', title: 'Entrega — calendário editorial', phone: '',              company: 'Café Central', start: '15:00', durationMin: 30, status: 'agendado',     type: 'entrega',  visibility: 'equipe' },

  // Diego — tráfego
  { id: 'e8',  memberId: 'm3', title: 'Otimização de campanhas',      phone: '',                                        start: '08:30', durationMin: 90, status: 'finalizado',   type: 'interno',  visibility: 'equipe' },
  { id: 'e9',  memberId: 'm3', title: 'Call — resultados Grupo Andrade', phone: '5215598765432', company: 'Grupo Andrade', start: '13:00', durationMin: 30, status: 'confirmado', type: 'call',   visibility: 'equipe' },
  { id: 'e10', memberId: 'm3', title: 'Almoço',                       phone: '',                                        start: '12:00', durationMin: 60, status: 'agendado',     type: 'bloqueio', visibility: 'equipe' },

  // Paula — audiovisual
  { id: 'e11', memberId: 'm4', title: 'Gravação — Café Central',      phone: '5215577778888', company: 'Café Central',  start: '10:00', durationMin: 120, status: 'confirmado',  type: 'gravacao', visibility: 'equipe' },
  { id: 'e12', memberId: 'm4', title: 'Edição — reels Vida Bella',    phone: '',              company: 'Vida Bella',    start: '14:30', durationMin: 90, status: 'agendado',     type: 'interno',  visibility: 'equipe' },
]

/** Faixa de horário exibida na agenda. */
export const AGENDA_START_HOUR = 8
export const AGENDA_END_HOUR = 19
export const SLOT_MINUTES = 30
